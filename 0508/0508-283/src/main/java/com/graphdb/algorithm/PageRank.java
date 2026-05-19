package com.graphdb.algorithm;

import com.graphdb.bsp.BSPEngine;
import com.graphdb.bsp.ComputeVertex;
import com.graphdb.bsp.OptimizedBSPEngine;
import com.graphdb.config.GraphDBConfig;
import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class PageRank {

    @Autowired
    private BSPEngine bspEngine;

    @Autowired
    private OptimizedBSPEngine optimizedBSPEngine;

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphDBConfig config;

    public Map<Long, Double> compute() {
        return compute(config.getAlgorithm().getPagerank().getDampingFactor(),
                config.getAlgorithm().getPagerank().getConvergenceThreshold(),
                config.getAlgorithm().getPagerank().getMaxIterations());
    }

    public Map<Long, Double> compute(double dampingFactor, double convergenceThreshold, int maxIterations) {
        return computeOptimized(dampingFactor, convergenceThreshold, maxIterations);
    }

    public Map<Long, Double> computeOptimized(double dampingFactor, double convergenceThreshold, int maxIterations) {
        log.info("Starting optimized PageRank computation. dampingFactor={}, convergenceThreshold={}, maxIterations={}",
                dampingFactor, convergenceThreshold, maxIterations);

        long startTime = System.nanoTime();
        long totalVertices = graphStore.getVertexCount();
        double initialRank = 1.0 / totalVertices;

        Map<Long, Double> result = optimizedBSPEngine.execute(
                (vertex, context) -> {
                    int superstep = context.getSuperstep();

                    if (superstep == 0) {
                        double initialPageRank = 1.0 / context.getTotalVertices();
                        vertex.setVertexValue(initialPageRank);
                        sendPageRankBatch(vertex, initialPageRank, context);
                    } else {
                        List<Double> messages = (List<Double>) vertex.getIncomingMessages();
                        double sum = 0.0;
                        if (!messages.isEmpty()) {
                            for (Double msg : messages) {
                                sum += msg;
                            }
                        }

                        double oldRank = vertex.getVertexValue();
                        double newRank = (1 - dampingFactor) / context.getTotalVertices() + dampingFactor * sum;

                        vertex.setVertexValue(newRank);

                        double diff = Math.abs(newRank - oldRank);
                        if (diff > convergenceThreshold) {
                            sendPageRankBatch(vertex, newRank, context);
                        } else {
                            vertex.voteToHalt();
                        }
                    }
                    vertex.clearMessages();
                },
                Double.class,
                initialRank,
                maxIterations
        );

        long duration = System.nanoTime() - startTime;
        log.info("Optimized PageRank computation completed in {} ms", duration / 1_000_000);
        return result;
    }

    private void sendPageRankBatch(ComputeVertex<Double, Edge, Double> vertex, double rank,
                                    com.graphdb.bsp.OptimizedBSPContext<Double, Edge, Double> context) {
        List<Edge> edges = vertex.getEdges();
        if (!edges.isEmpty()) {
            double contribution = rank / edges.size();
            for (Edge edge : edges) {
                context.sendMessage(edge.getToVertexId(), contribution);
            }
        }
    }

    private void sendPageRank(ComputeVertex<Double, Edge, Double> vertex, double rank) {
        List<Edge> edges = vertex.getEdges();
        if (!edges.isEmpty()) {
            double contribution = rank / edges.size();
            for (Edge edge : edges) {
                vertex.sendMessage(edge.getToVertexId(), contribution);
            }
        }
    }

    public Map<Long, Double> computeAndStore() {
        Map<Long, Double> pageRanks = compute();
        for (Map.Entry<Long, Double> entry : pageRanks.entrySet()) {
            graphStore.updateVertexProperty(entry.getKey(), "pagerank", entry.getValue());
        }
        log.info("PageRank values stored in graph");
        return pageRanks;
    }
}