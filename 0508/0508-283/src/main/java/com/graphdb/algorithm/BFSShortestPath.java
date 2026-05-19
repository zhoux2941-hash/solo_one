package com.graphdb.algorithm;

import com.graphdb.bsp.BSPEngine;
import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class BFSShortestPath {

    @Autowired
    private BSPEngine bspEngine;

    @Autowired
    private GraphStore graphStore;

    public Map<Long, Integer> compute(long sourceVertexId) {
        log.info("Starting BFS shortest path computation from source: {}", sourceVertexId);

        Map<Long, Integer> result = bspEngine.execute(
                (vertex, context) -> {
                    int superstep = context.getSuperstep();

                    if (superstep == 0) {
                        if (vertex.getVertexId() == sourceVertexId) {
                            vertex.setVertexValue(0);
                            for (Edge edge : vertex.getEdges()) {
                                vertex.sendMessage(edge.getToVertexId(), superstep + 1);
                            }
                        } else {
                            vertex.setVertexValue(Integer.MAX_VALUE);
                        }
                    } else {
                        List<Integer> messages = (List<Integer>) vertex.getIncomingMessages();
                        if (!messages.isEmpty()) {
                            int currentDistance = vertex.getVertexValue();
                            int minDistance = messages.stream().mapToInt(Integer::intValue).min().orElse(Integer.MAX_VALUE);

                            if (minDistance < currentDistance) {
                                vertex.setVertexValue(minDistance);
                                for (Edge edge : vertex.getEdges()) {
                                    vertex.sendMessage(edge.getToVertexId(), minDistance + 1);
                                }
                            }
                        }
                        vertex.voteToHalt();
                    }
                    vertex.clearMessages();
                },
                Integer.class,
                Integer.MAX_VALUE,
                100
        );

        log.info("BFS shortest path computation completed");
        return result;
    }

    public Map<Long, List<Long>> computeWithPaths(long sourceVertexId) {
        Map<Long, Integer> distances = compute(sourceVertexId);
        Map<Long, List<Long>> paths = new HashMap<>();

        Map<Integer, List<Long>> distanceGroups = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : distances.entrySet()) {
            if (entry.getValue() < Integer.MAX_VALUE) {
                distanceGroups.computeIfAbsent(entry.getValue(), k -> new ArrayList<>())
                        .add(entry.getKey());
            }
        }

        paths.put(sourceVertexId, Collections.singletonList(sourceVertexId));

        for (int d = 1; distanceGroups.containsKey(d); d++) {
            for (long vertexId : distanceGroups.get(d)) {
                List<Edge> inEdges = graphStore.getInEdges(vertexId);
                for (Edge inEdge : inEdges) {
                    long neighborId = inEdge.getFromVertexId();
                    if (distances.get(neighborId) == d - 1 && paths.containsKey(neighborId)) {
                        List<Long> path = new ArrayList<>(paths.get(neighborId));
                        path.add(vertexId);
                        paths.put(vertexId, path);
                        break;
                    }
                }
            }
        }

        return paths;
    }

    public Map<Long, Integer> compute(long sourceVertexId, long targetVertexId) {
        Map<Long, Integer> allDistances = compute(sourceVertexId);
        int distance = allDistances.getOrDefault(targetVertexId, Integer.MAX_VALUE);
        return Collections.singletonMap(targetVertexId, distance);
    }

    public Map<Long, Integer> weightedCompute(long sourceVertexId) {
        log.info("Starting weighted BFS shortest path computation from source: {}", sourceVertexId);

        Map<Long, Double> distances = new HashMap<>();
        Map<Long, Boolean> visited = new HashMap<>();
        PriorityQueue<Map.Entry<Long, Double>> pq = new PriorityQueue<>(
                Comparator.comparingDouble(Map.Entry::getValue)
        );

        for (long vertexId : graphStore.getAllVertexIds()) {
            distances.put(vertexId, Double.POSITIVE_INFINITY);
            visited.put(vertexId, false);
        }
        distances.put(sourceVertexId, 0.0);
        pq.add(new AbstractMap.SimpleEntry<>(sourceVertexId, 0.0));

        while (!pq.isEmpty()) {
            Map.Entry<Long, Double> entry = pq.poll();
            long vertexId = entry.getKey();
            double currentDist = entry.getValue();

            if (visited.get(vertexId)) {
                continue;
            }
            visited.put(vertexId, true);

            for (Edge edge : graphStore.getOutEdges(vertexId)) {
                long neighborId = edge.getToVertexId();
                double weight = edge.getWeight();
                double newDist = currentDist + weight;

                if (newDist < distances.get(neighborId)) {
                    distances.put(neighborId, newDist);
                    pq.add(new AbstractMap.SimpleEntry<>(neighborId, newDist));
                }
            }
        }

        Map<Long, Integer> result = new HashMap<>();
        for (Map.Entry<Long, Double> entry : distances.entrySet()) {
            result.put(entry.getKey(), entry.getValue() != Double.POSITIVE_INFINITY ?
                    (int) Math.round(entry.getValue()) : Integer.MAX_VALUE);
        }

        return result;
    }
}