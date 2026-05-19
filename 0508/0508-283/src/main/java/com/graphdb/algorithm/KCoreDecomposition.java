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
public class KCoreDecomposition {

    @Autowired
    private BSPEngine bspEngine;

    @Autowired
    private GraphStore graphStore;

    public Map<Long, Integer> compute() {
        log.info("Starting K-core decomposition");

        Set<Long> vertexIds = graphStore.getAllVertexIds();
        Map<Long, Integer> degrees = new HashMap<>();
        Map<Long, List<Long>> adjacency = new HashMap<>();

        for (long vertexId : vertexIds) {
            List<Long> neighbors = graphStore.getOutNeighbors(vertexId);
            degrees.put(vertexId, neighbors.size());
            adjacency.put(vertexId, new ArrayList<>(neighbors));
        }

        int maxDegree = degrees.values().stream().max(Integer::compareTo).orElse(0);
        List<List<Long>> buckets = new ArrayList<>();
        for (int i = 0; i <= maxDegree; i++) {
            buckets.add(new ArrayList<>());
        }

        for (Map.Entry<Long, Integer> entry : degrees.entrySet()) {
            buckets.get(entry.getValue()).add(entry.getKey());
        }

        Map<Long, Integer> coreNumbers = new HashMap<>();
        Map<Long, Boolean> removed = new HashMap<>();

        for (long vertexId : vertexIds) {
            removed.put(vertexId, false);
        }

        for (int k = 0; k <= maxDegree; k++) {
            while (!buckets.get(k).isEmpty()) {
                long vertexId = buckets.get(k).remove(buckets.get(k).size() - 1);

                if (removed.get(vertexId)) {
                    continue;
                }

                removed.put(vertexId, true);
                coreNumbers.put(vertexId, k);

                for (long neighborId : adjacency.get(vertexId)) {
                    if (!removed.get(neighborId)) {
                        int oldDegree = degrees.get(neighborId);
                        if (oldDegree > k) {
                            int newDegree = oldDegree - 1;
                            degrees.put(neighborId, newDegree);
                            buckets.get(newDegree).add(neighborId);
                        }
                    }
                }
            }
        }

        log.info("K-core decomposition completed. Max core number: {}",
                coreNumbers.values().stream().max(Integer::compareTo).orElse(0));

        return coreNumbers;
    }

    public Map<Long, Integer> computeBSP() {
        log.info("Starting K-core decomposition using BSP");

        Map<Long, Integer> result = bspEngine.execute(
                (vertex, context) -> {
                    int superstep = context.getSuperstep();

                    if (superstep == 0) {
                        int degree = vertex.getEdges().size();
                        vertex.setVertexValue(degree);

                        for (Edge edge : vertex.getEdges()) {
                            vertex.sendMessage(edge.getToVertexId(), degree);
                        }
                    } else {
                        List<Integer> messages = (List<Integer>) vertex.getIncomingMessages();

                        if (!messages.isEmpty()) {
                            int currentCore = vertex.getVertexValue();
                            int activeNeighbors = 0;

                            for (int neighborCore : messages) {
                                if (neighborCore >= currentCore) {
                                    activeNeighbors++;
                                }
                            }

                            int newCore = Math.min(currentCore, activeNeighbors);

                            if (newCore < currentCore) {
                                vertex.setVertexValue(newCore);
                                for (Edge edge : vertex.getEdges()) {
                                    vertex.sendMessage(edge.getToVertexId(), newCore);
                                }
                            } else {
                                vertex.voteToHalt();
                            }
                        } else {
                            vertex.voteToHalt();
                        }
                    }
                    vertex.clearMessages();
                },
                Integer.class,
                0,
                50
        );

        log.info("K-core decomposition completed");
        return result;
    }

    public Map<Long, Integer> getKCore(int k) {
        Map<Long, Integer> coreNumbers = compute();
        Map<Long, Integer> kCore = new HashMap<>();

        for (Map.Entry<Long, Integer> entry : coreNumbers.entrySet()) {
            if (entry.getValue() >= k) {
                kCore.put(entry.getKey(), entry.getValue());
            }
        }

        log.info("{}-core contains {} vertices", k, kCore.size());
        return kCore;
    }

    public int getMaxCoreNumber() {
        return compute().values().stream().max(Integer::compareTo).orElse(0);
    }

    public Map<Integer, Integer> getCoreDistribution() {
        Map<Long, Integer> coreNumbers = compute();
        Map<Integer, Integer> distribution = new HashMap<>();

        for (int core : coreNumbers.values()) {
            distribution.merge(core, 1, Integer::sum);
        }

        return distribution;
    }

    public Map<Long, Integer> computeAndStore() {
        Map<Long, Integer> coreNumbers = compute();
        for (Map.Entry<Long, Integer> entry : coreNumbers.entrySet()) {
            graphStore.updateVertexProperty(entry.getKey(), "coreNumber", entry.getValue());
        }
        log.info("Core numbers stored in graph");
        return coreNumbers;
    }
}