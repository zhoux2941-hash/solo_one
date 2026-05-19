package com.graphdb.algorithm;

import com.graphdb.config.GraphDBConfig;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class LouvainCommunity {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphDBConfig config;

    @Data
    public static class CommunityResult {
        private Map<Long, Long> vertexToCommunity;
        private int numCommunities;
        private double modularity;
    }

    public CommunityResult compute() {
        return compute(config.getAlgorithm().getLouvain().getResolution(),
                config.getAlgorithm().getLouvain().getMaxIterations());
    }

    public CommunityResult compute(double resolution, int maxIterations) {
        log.info("Starting Louvain community detection. resolution={}, maxIterations={}",
                resolution, maxIterations);

        Set<Long> vertexIds = graphStore.getAllVertexIds();
        Map<Long, Long> vertexToCommunity = new HashMap<>();
        long communityId = 0;
        for (long vertexId : vertexIds) {
            vertexToCommunity.put(vertexId, communityId++);
        }

        double m = computeTotalWeight();

        boolean improved = true;
        int iteration = 0;

        while (improved && iteration < maxIterations) {
            improved = false;
            iteration++;

            for (long vertexId : vertexIds) {
                long originalCommunity = vertexToCommunity.get(vertexId);

                Map<Long, Double> communityWeights = computeCommunityWeights(
                        vertexId, vertexToCommunity);

                Map<Long, Double> communityTotals = computeCommunityTotals(vertexToCommunity);

                double k_i = computeVertexWeightSum(vertexId);

                double bestGain = 0.0;
                long bestCommunity = originalCommunity;

                for (Map.Entry<Long, Double> entry : communityWeights.entrySet()) {
                    long targetCommunity = entry.getKey();
                    double k_i_in = entry.getValue();
                    double sum_total = communityTotals.getOrDefault(targetCommunity, 0.0);

                    double gain = k_i_in - resolution * sum_total * k_i / (2 * m);

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestCommunity = targetCommunity;
                    }
                }

                if (bestCommunity != originalCommunity) {
                    vertexToCommunity.put(vertexId, bestCommunity);
                    improved = true;
                }
            }

            if (improved) {
                Map<Long, Long> renumbered = renumberCommunities(vertexToCommunity);
                vertexToCommunity = renumbered;
            }

            log.debug("Iteration {} completed. Communities: {}", iteration,
                    new HashSet<>(vertexToCommunity.values()).size());
        }

        double modularity = computeModularity(vertexToCommunity, m);

        CommunityResult result = new CommunityResult();
        result.setVertexToCommunity(vertexToCommunity);
        result.setNumCommunities(new HashSet<>(vertexToCommunity.values()).size());
        result.setModularity(modularity);

        log.info("Louvain community detection completed. Communities: {}, Modularity: {}",
                result.getNumCommunities(), result.getModularity());
        return result;
    }

    private double computeTotalWeight() {
        double total = 0.0;
        for (long vertexId : graphStore.getAllVertexIds()) {
            for (Edge edge : graphStore.getOutEdges(vertexId)) {
                total += edge.getWeight();
            }
        }
        return total / 2.0;
    }

    private double computeVertexWeightSum(long vertexId) {
        double sum = 0.0;
        for (Edge edge : graphStore.getOutEdges(vertexId)) {
            sum += edge.getWeight();
        }
        for (Edge edge : graphStore.getInEdges(vertexId)) {
            sum += edge.getWeight();
        }
        return sum;
    }

    private Map<Long, Double> computeCommunityWeights(long vertexId,
                                                      Map<Long, Long> vertexToCommunity) {
        Map<Long, Double> weights = new HashMap<>();

        for (Edge edge : graphStore.getOutEdges(vertexId)) {
            long neighborCommunity = vertexToCommunity.get(edge.getToVertexId());
            weights.merge(neighborCommunity, edge.getWeight(), Double::sum);
        }

        for (Edge edge : graphStore.getInEdges(vertexId)) {
            long neighborCommunity = vertexToCommunity.get(edge.getFromVertexId());
            weights.merge(neighborCommunity, edge.getWeight(), Double::sum);
        }

        return weights;
    }

    private Map<Long, Double> computeCommunityTotals(Map<Long, Long> vertexToCommunity) {
        Map<Long, Double> totals = new HashMap<>();

        for (Map.Entry<Long, Long> entry : vertexToCommunity.entrySet()) {
            long vertexId = entry.getKey();
            long community = entry.getValue();
            double weightSum = computeVertexWeightSum(vertexId);
            totals.merge(community, weightSum, Double::sum);
        }

        return totals;
    }

    private double computeModularity(Map<Long, Long> vertexToCommunity, double m) {
        Map<Long, Double> communityIn = new HashMap<>();
        Map<Long, Double> communityTot = new HashMap<>();

        for (long vertexId : graphStore.getAllVertexIds()) {
            long community = vertexToCommunity.get(vertexId);
            double k_i = computeVertexWeightSum(vertexId);

            communityTot.merge(community, k_i, Double::sum);

            for (Edge edge : graphStore.getOutEdges(vertexId)) {
                long neighborCommunity = vertexToCommunity.get(edge.getToVertexId());
                if (community == neighborCommunity) {
                    communityIn.merge(community, edge.getWeight(), Double::sum);
                }
            }
        }

        double modularity = 0.0;
        for (long community : communityIn.keySet()) {
            double in = communityIn.get(community);
            double tot = communityTot.get(community);
            modularity += (in / (2 * m)) - (tot * tot) / (4 * m * m);
        }

        return modularity;
    }

    private Map<Long, Long> renumberCommunities(Map<Long, Long> vertexToCommunity) {
        Map<Long, Long> renumbered = new HashMap<>();
        Map<Long, Long> communityMap = new HashMap<>();
        long newId = 0;

        for (long oldId : vertexToCommunity.values()) {
            if (!communityMap.containsKey(oldId)) {
                communityMap.put(oldId, newId++);
            }
        }

        for (Map.Entry<Long, Long> entry : vertexToCommunity.entrySet()) {
            renumbered.put(entry.getKey(), communityMap.get(entry.getValue()));
        }

        return renumbered;
    }

    public CommunityResult computeAndStore() {
        CommunityResult result = compute();
        for (Map.Entry<Long, Long> entry : result.getVertexToCommunity().entrySet()) {
            graphStore.updateVertexProperty(entry.getKey(), "community", entry.getValue());
        }
        log.info("Community assignments stored in graph");
        return result;
    }
}