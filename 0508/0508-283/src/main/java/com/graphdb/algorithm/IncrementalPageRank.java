package com.graphdb.algorithm;

import com.graphdb.config.GraphDBConfig;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class IncrementalPageRank {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphDBConfig config;

    private final Map<Long, Double> currentPageRanks = new HashMap<>();
    private final Map<Long, Double> previousPageRanks = new HashMap<>();
    private final Set<Long> affectedVertices = new HashSet<>();
    private final Set<Long> modifiedEdges = new HashSet<>();

    public void initialize(Map<Long, Double> initialPageRanks) {
        this.currentPageRanks.putAll(initialPageRanks);
        this.previousPageRanks.putAll(initialPageRanks);
        this.affectedVertices.clear();
        this.modifiedEdges.clear();
        log.info("Incremental PageRank initialized with {} vertices", initialPageRanks.size());
    }

    public void onVertexAdded(Vertex vertex) {
        affectedVertices.add(vertex.getId());
        log.debug("Vertex added: {}, marked as affected", vertex.getId());
    }

    public void onVertexRemoved(long vertexId) {
        affectedVertices.remove(vertexId);
        currentPageRanks.remove(vertexId);
        previousPageRanks.remove(vertexId);

        List<Edge> outEdges = graphStore.getOutEdges(vertexId);
        List<Edge> inEdges = graphStore.getInEdges(vertexId);

        for (Edge edge : outEdges) {
            affectedVertices.add(edge.getToVertexId());
        }
        for (Edge edge : inEdges) {
            affectedVertices.add(edge.getFromVertexId());
        }

        log.debug("Vertex removed: {}, affected neighbors marked", vertexId);
    }

    public void onEdgeAdded(Edge edge) {
        modifiedEdges.add(edge.getId());
        affectedVertices.add(edge.getFromVertexId());
        affectedVertices.add(edge.getToVertexId());
        log.debug("Edge added: {} -> {}, vertices marked as affected",
                edge.getFromVertexId(), edge.getToVertexId());
    }

    public void onEdgeRemoved(Edge edge) {
        modifiedEdges.remove(edge.getId());
        affectedVertices.add(edge.getFromVertexId());
        affectedVertices.add(edge.getToVertexId());
        log.debug("Edge removed: {} -> {}, vertices marked as affected",
                edge.getFromVertexId(), edge.getToVertexId());
    }

    public Map<Long, Double> update() {
        return update(config.getAlgorithm().getPagerank().getDampingFactor(),
                config.getAlgorithm().getPagerank().getConvergenceThreshold(),
                config.getAlgorithm().getPagerank().getMaxIterations());
    }

    public Map<Long, Double> update(double dampingFactor, double convergenceThreshold, int maxIterations) {
        if (affectedVertices.isEmpty()) {
            log.info("No affected vertices. Skipping incremental PageRank update.");
            return currentPageRanks;
        }

        log.info("Starting incremental PageRank update. Affected vertices: {}, convergenceThreshold={}",
                affectedVertices.size(), convergenceThreshold);

        Set<Long> propagationSet = new HashSet<>(affectedVertices);
        propagationSet = expandAffectedSet(propagationSet, 3);

        long totalVertices = graphStore.getVertexCount();
        double teleport = (1 - dampingFactor) / totalVertices;

        Map<Long, Double> newPageRanks = new HashMap<>(currentPageRanks);
        int iterations = 0;
        boolean converged = false;

        while (!converged && iterations < maxIterations) {
            converged = true;
            double maxDiff = 0.0;

            for (long vertexId : propagationSet) {
                List<Edge> inEdges = graphStore.getInEdges(vertexId);
                double sum = 0.0;

                for (Edge inEdge : inEdges) {
                    long sourceId = inEdge.getFromVertexId();
                    int outDegree = graphStore.getOutDegree(sourceId);

                    if (outDegree > 0) {
                        Double sourceRank = currentPageRanks.get(sourceId);
                        if (sourceRank == null) {
                            sourceRank = 1.0 / totalVertices;
                        }
                        sum += sourceRank / outDegree;
                    }
                }

                double oldRank = currentPageRanks.getOrDefault(vertexId, 1.0 / totalVertices);
                double newRank = teleport + dampingFactor * sum;
                newPageRanks.put(vertexId, newRank);

                double diff = Math.abs(newRank - oldRank);
                if (diff > maxDiff) {
                    maxDiff = diff;
                }

                if (diff > convergenceThreshold) {
                    converged = false;
                }
            }

            currentPageRanks.putAll(newPageRanks);
            iterations++;

            log.debug("Iteration {} completed. Max difference: {}", iterations, maxDiff);
        }

        affectedVertices.clear();
        modifiedEdges.clear();

        log.info("Incremental PageRank update completed after {} iterations", iterations);
        return currentPageRanks;
    }

    private Set<Long> expandAffectedSet(Set<Long> initialSet, int levels) {
        Set<Long> expanded = new HashSet<>(initialSet);

        for (int level = 0; level < levels; level++) {
            Set<Long> newVertices = new HashSet<>();

            for (long vertexId : expanded) {
                List<Long> outNeighbors = graphStore.getOutNeighbors(vertexId);
                List<Long> inNeighbors = graphStore.getInNeighbors(vertexId);

                newVertices.addAll(outNeighbors);
                newVertices.addAll(inNeighbors);
            }

            expanded.addAll(newVertices);
        }

        log.debug("Affected set expanded from {} to {} vertices",
                initialSet.size(), expanded.size());
        return expanded;
    }

    public Map<Long, Double> getCurrentPageRanks() {
        return Collections.unmodifiableMap(currentPageRanks);
    }

    public double getVertexPageRank(long vertexId) {
        return currentPageRanks.getOrDefault(vertexId, 0.0);
    }

    public void reset() {
        currentPageRanks.clear();
        previousPageRanks.clear();
        affectedVertices.clear();
        modifiedEdges.clear();
        log.info("Incremental PageRank reset");
    }
}