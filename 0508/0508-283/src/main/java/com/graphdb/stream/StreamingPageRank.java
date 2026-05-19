package com.graphdb.stream;

import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class StreamingPageRank {

    @Autowired
    private GraphStore graphStore;

    private final Map<Long, Double> pageRanks;
    private final Map<Long, Integer> outDegrees;
    private final Map<Long, Set<Long>> inNeighbors;
    private final Set<Long> affectedVertices;

    private double dampingFactor = 0.85;
    private double convergenceThreshold = 1e-4;
    private int maxIterations = 20;

    private final AtomicInteger updateCount;
    private long lastFullComputationTime;

    public StreamingPageRank() {
        this.pageRanks = new ConcurrentHashMap<>();
        this.outDegrees = new ConcurrentHashMap<>();
        this.inNeighbors = new ConcurrentHashMap<>();
        this.affectedVertices = ConcurrentHashMap.newKeySet();
        this.updateCount = new AtomicInteger(0);
        this.lastFullComputationTime = System.currentTimeMillis();
    }

    public void initialize(Map<Long, Double> initialPageRanks) {
        this.pageRanks.putAll(initialPageRanks);

        for (long vertexId : initialPageRanks.keySet()) {
            outDegrees.put(vertexId, graphStore.getOutDegree(vertexId));
            List<Long> neighbors = graphStore.getInNeighbors(vertexId);
            inNeighbors.put(vertexId, new HashSet<>(neighbors));
        }

        log.info("Streaming PageRank initialized with {} vertices", pageRanks.size());
    }

    public void onEdgeAdded(Edge edge) {
        long fromId = edge.getFromVertexId();
        long toId = edge.getToVertexId();

        ensureVertexExists(fromId);
        ensureVertexExists(toId);

        outDegrees.put(fromId, outDegrees.get(fromId) + 1);
        inNeighbors.computeIfAbsent(toId, k -> new HashSet<>()).add(fromId);

        affectedVertices.add(toId);
        affectedVertices.add(fromId);

        propagateInfluence(toId, new HashSet<>(), 3);

        updateCount.incrementAndGet();

        log.debug("Edge added: {} -> {}, marking vertices for update", fromId, toId);
    }

    public void onEdgeRemoved(Edge edge) {
        long fromId = edge.getFromVertexId();
        long toId = edge.getToVertexId();

        if (outDegrees.containsKey(fromId)) {
            outDegrees.put(fromId, Math.max(0, outDegrees.get(fromId) - 1));
        }

        Set<Long> neighbors = inNeighbors.get(toId);
        if (neighbors != null) {
            neighbors.remove(fromId);
        }

        affectedVertices.add(toId);
        affectedVertices.add(fromId);

        propagateInfluence(toId, new HashSet<>(), 3);

        updateCount.incrementAndGet();

        log.debug("Edge removed: {} -> {}, marking vertices for update", fromId, toId);
    }

    private void propagateInfluence(long startVertex, Set<Long> visited, int depth) {
        if (depth <= 0 || visited.contains(startVertex)) {
            return;
        }

        visited.add(startVertex);
        affectedVertices.add(startVertex);

        for (long outNeighbor : getOutNeighbors(startVertex)) {
            propagateInfluence(outNeighbor, visited, depth - 1);
        }
    }

    private Set<Long> getOutNeighbors(long vertexId) {
        Set<Long> outNeighbors = new HashSet<>();
        for (Map.Entry<Long, Set<Long>> entry : inNeighbors.entrySet()) {
            if (entry.getValue().contains(vertexId)) {
                outNeighbors.add(entry.getKey());
            }
        }
        return outNeighbors;
    }

    private void ensureVertexExists(long vertexId) {
        pageRanks.computeIfAbsent(vertexId, k -> 1.0 / getTotalVertices());
        outDegrees.computeIfAbsent(vertexId, k -> 0);
        inNeighbors.computeIfAbsent(vertexId, k -> new HashSet<>());
    }

    private long getTotalVertices() {
        return Math.max(1, pageRanks.size());
    }

    public Map<Long, Double> updateIncremental() {
        if (affectedVertices.isEmpty()) {
            log.debug("No affected vertices, skipping incremental update");
            return new HashMap<>(pageRanks);
        }

        log.info("Running incremental PageRank update for {} affected vertices", affectedVertices.size());

        Set<Long> updateSet = expandUpdateSet(affectedVertices, 2);

        double teleport = (1 - dampingFactor) / getTotalVertices();

        for (int iteration = 0; iteration < maxIterations; iteration++) {
            Map<Long, Double> newRanks = new HashMap<>();
            double maxDiff = 0.0;
            int updatedCount = 0;

            for (long vertexId : updateSet) {
                double sum = 0.0;
                Set<Long> neighbors = inNeighbors.get(vertexId);

                if (neighbors != null) {
                    for (long neighbor : neighbors) {
                        int outDegree = outDegrees.getOrDefault(neighbor, 0);
                        if (outDegree > 0) {
                            double neighborRank = pageRanks.getOrDefault(neighbor, 1.0 / getTotalVertices());
                            sum += neighborRank / outDegree;
                        }
                    }
                }

                double oldRank = pageRanks.getOrDefault(vertexId, 1.0 / getTotalVertices());
                double newRank = teleport + dampingFactor * sum;
                newRanks.put(vertexId, newRank);

                maxDiff = Math.max(maxDiff, Math.abs(newRank - oldRank));
                updatedCount++;
            }

            pageRanks.putAll(newRanks);

            if (maxDiff < convergenceThreshold) {
                log.debug("Incremental PageRank converged after {} iterations, maxDiff={}",
                        iteration + 1, maxDiff);
                break;
            }
        }

        affectedVertices.clear();

        normalizePageRanks();

        return new HashMap<>(pageRanks);
    }

    private Set<Long> expandUpdateSet(Set<Long> coreSet, int levels) {
        Set<Long> expanded = new HashSet<>(coreSet);
        Set<Long> currentLevel = new HashSet<>(coreSet);

        for (int i = 0; i < levels; i++) {
            Set<Long> nextLevel = new HashSet<>();
            for (long vertexId : currentLevel) {
                nextLevel.addAll(getOutNeighbors(vertexId));
                Set<Long> neighbors = inNeighbors.get(vertexId);
                if (neighbors != null) {
                    nextLevel.addAll(neighbors);
                }
            }
            nextLevel.removeAll(expanded);
            if (nextLevel.isEmpty()) {
                break;
            }
            expanded.addAll(nextLevel);
            currentLevel = nextLevel;
        }

        return expanded;
    }

    private void normalizePageRanks() {
        double sum = pageRanks.values().stream().mapToDouble(Double::doubleValue).sum();
        if (sum > 0) {
            for (Map.Entry<Long, Double> entry : pageRanks.entrySet()) {
                entry.setValue(entry.getValue() / sum);
            }
        }
    }

    public Map<Long, Double> computeFull() {
        log.info("Running full PageRank computation");

        Set<Long> allVertices = graphStore.getAllVertexIds();
        Map<Long, Double> newPageRanks = new HashMap<>();
        double initialRank = 1.0 / allVertices.size();
        double teleport = (1 - dampingFactor) / allVertices.size();

        for (long vertexId : allVertices) {
            newPageRanks.put(vertexId, initialRank);
            outDegrees.put(vertexId, graphStore.getOutDegree(vertexId));
            List<Long> neighbors = graphStore.getInNeighbors(vertexId);
            inNeighbors.put(vertexId, new HashSet<>(neighbors));
        }

        for (int iteration = 0; iteration < maxIterations; iteration++) {
            Map<Long, Double> updatedRanks = new HashMap<>();
            double maxDiff = 0.0;

            for (long vertexId : allVertices) {
                double sum = 0.0;
                List<Long> neighbors = graphStore.getInNeighbors(vertexId);

                for (long neighbor : neighbors) {
                    int outDegree = outDegrees.getOrDefault(neighbor, 0);
                    if (outDegree > 0) {
                        sum += newPageRanks.getOrDefault(neighbor, initialRank) / outDegree;
                    }
                }

                double oldRank = newPageRanks.get(vertexId);
                double newRank = teleport + dampingFactor * sum;
                updatedRanks.put(vertexId, newRank);

                maxDiff = Math.max(maxDiff, Math.abs(newRank - oldRank));
            }

            newPageRanks.putAll(updatedRanks);

            if (maxDiff < convergenceThreshold) {
                log.debug("Full PageRank converged after {} iterations", iteration + 1);
                break;
            }
        }

        pageRanks.clear();
        pageRanks.putAll(newPageRanks);
        normalizePageRanks();

        lastFullComputationTime = System.currentTimeMillis();
        affectedVertices.clear();

        return new HashMap<>(pageRanks);
    }

    public double getVertexRank(long vertexId) {
        return pageRanks.getOrDefault(vertexId, 1.0 / getTotalVertices());
    }

    public Map<Long, Double> getCurrentPageRanks() {
        return new HashMap<>(pageRanks);
    }

    public int getUpdateCount() {
        return updateCount.get();
    }

    public void setDampingFactor(double dampingFactor) {
        this.dampingFactor = dampingFactor;
    }

    public void setConvergenceThreshold(double convergenceThreshold) {
        this.convergenceThreshold = convergenceThreshold;
    }

    public void setMaxIterations(int maxIterations) {
        this.maxIterations = maxIterations;
    }

    public void reset() {
        pageRanks.clear();
        outDegrees.clear();
        inNeighbors.clear();
        affectedVertices.clear();
        updateCount.set(0);
    }
}