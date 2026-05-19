package com.graphdb.stream;

import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class IncrementalCommunityDetection {

    @Autowired
    private GraphStore graphStore;

    private final Map<Long, Long> vertexToCommunity;
    private final Map<Long, CommunityStats> communityStats;
    private final Set<Long> affectedVertices;
    private final Set<Long> affectedCommunities;

    private double resolution = 1.0;
    private int maxLocalMoveIterations = 5;

    private long totalEdgeWeight = 0;

    public IncrementalCommunityDetection() {
        this.vertexToCommunity = new ConcurrentHashMap<>();
        this.communityStats = new ConcurrentHashMap<>();
        this.affectedVertices = ConcurrentHashMap.newKeySet();
        this.affectedCommunities = ConcurrentHashMap.newKeySet();
    }

    @Data
    private static class CommunityStats {
        long internalEdges = 0;
        double totalDegree = 0;
        Set<Long> vertices = ConcurrentHashMap.newKeySet();
    }

    public void initialize(Map<Long, Long> initialCommunities) {
        vertexToCommunity.putAll(initialCommunities);

        for (Map.Entry<Long, Long> entry : initialCommunities.entrySet()) {
            long vertexId = entry.getKey();
            long communityId = entry.getValue();

            CommunityStats stats = communityStats.computeIfAbsent(communityId, k -> new CommunityStats());
            stats.getVertices().add(vertexId);
            stats.setTotalDegree(stats.getTotalDegree() + graphStore.getOutDegree(vertexId) + graphStore.getInDegree(vertexId));
        }

        recalculateInternalEdges();
        totalEdgeWeight = calculateTotalEdgeWeight();

        log.info("Incremental community detection initialized with {} vertices and {} communities",
                vertexToCommunity.size(), communityStats.size());
    }

    public void onEdgeAdded(Edge edge) {
        long fromId = edge.getFromVertexId();
        long toId = edge.getToVertexId();
        double weight = edge.getWeight();

        ensureVertexInCommunity(fromId);
        ensureVertexInCommunity(toId);

        Long fromCommunity = vertexToCommunity.get(fromId);
        Long toCommunity = vertexToCommunity.get(toId);

        if (fromCommunity.equals(toCommunity)) {
            CommunityStats stats = communityStats.get(fromCommunity);
            if (stats != null) {
                stats.setInternalEdges(stats.getInternalEdges() + (long) weight);
            }
        }

        affectedVertices.add(fromId);
        affectedVertices.add(toId);

        if (!fromCommunity.equals(toCommunity)) {
            affectedCommunities.add(fromCommunity);
            affectedCommunities.add(toCommunity);
        }

        totalEdgeWeight += weight;

        log.debug("Edge added: {} -> {}, marking vertices for community update", fromId, toId);
    }

    public void onEdgeRemoved(Edge edge) {
        long fromId = edge.getFromVertexId();
        long toId = edge.getToVertexId();
        double weight = edge.getWeight();

        Long fromCommunity = vertexToCommunity.get(fromId);
        Long toCommunity = vertexToCommunity.get(toId);

        if (fromCommunity != null && fromCommunity.equals(toCommunity)) {
            CommunityStats stats = communityStats.get(fromCommunity);
            if (stats != null) {
                stats.setInternalEdges(Math.max(0, stats.getInternalEdges() - (long) weight));
            }
        }

        if (fromCommunity != null) {
            affectedVertices.add(fromId);
            affectedCommunities.add(fromCommunity);
        }
        if (toCommunity != null) {
            affectedVertices.add(toId);
            affectedCommunities.add(toCommunity);
        }

        totalEdgeWeight = Math.max(0, totalEdgeWeight - (long) weight);

        log.debug("Edge removed: {} -> {}, marking vertices for community update", fromId, toId);
    }

    private void ensureVertexInCommunity(long vertexId) {
        if (!vertexToCommunity.containsKey(vertexId)) {
            vertexToCommunity.put(vertexId, vertexId);
            CommunityStats stats = communityStats.computeIfAbsent(vertexId, k -> new CommunityStats());
            stats.getVertices().add(vertexId);
            stats.setTotalDegree(graphStore.getOutDegree(vertexId) + graphStore.getInDegree(vertexId));
        }
    }

    public Map<Long, Long> updateCommunities() {
        if (affectedVertices.isEmpty()) {
            log.debug("No affected vertices, skipping community update");
            return new HashMap<>(vertexToCommunity);
        }

        log.info("Running incremental community update for {} affected vertices and {} communities",
                affectedVertices.size(), affectedCommunities.size());

        Set<Long> updateVertices = expandUpdateSet(affectedVertices, 2);

        for (int iteration = 0; iteration < maxLocalMoveIterations; iteration++) {
            boolean changed = false;

            for (long vertexId : updateVertices) {
                long oldCommunity = vertexToCommunity.get(vertexId);
                long bestCommunity = findBestCommunity(vertexId);

                if (bestCommunity != oldCommunity) {
                    moveVertexToCommunity(vertexId, oldCommunity, bestCommunity);
                    changed = true;
                }
            }

            if (!changed) {
                log.debug("Community detection converged after {} iterations", iteration + 1);
                break;
            }
        }

        mergeSmallCommunities();

        affectedVertices.clear();
        affectedCommunities.clear();

        return new HashMap<>(vertexToCommunity);
    }

    private long findBestCommunity(long vertexId) {
        long currentCommunity = vertexToCommunity.get(vertexId);
        double currentModularityGain = computeModularityGain(vertexId, currentCommunity);

        Map<Long, Integer> neighborCommunities = getNeighborCommunities(vertexId);
        long bestCommunity = currentCommunity;
        double bestGain = currentModularityGain;

        for (long communityId : neighborCommunities.keySet()) {
            if (communityId != currentCommunity) {
                double gain = computeModularityGain(vertexId, communityId);
                if (gain > bestGain) {
                    bestGain = gain;
                    bestCommunity = communityId;
                }
            }
        }

        return bestCommunity;
    }

    private Map<Long, Integer> getNeighborCommunities(long vertexId) {
        Map<Long, Integer> communityCounts = new HashMap<>();

        List<Long> outNeighbors = graphStore.getOutNeighbors(vertexId);
        List<Long> inNeighbors = graphStore.getInNeighbors(vertexId);

        for (long neighbor : outNeighbors) {
            Long community = vertexToCommunity.get(neighbor);
            if (community != null) {
                communityCounts.merge(community, 1, Integer::sum);
            }
        }

        for (long neighbor : inNeighbors) {
            Long community = vertexToCommunity.get(neighbor);
            if (community != null) {
                communityCounts.merge(community, 1, Integer::sum);
            }
        }

        return communityCounts;
    }

    private double computeModularityGain(long vertexId, long targetCommunity) {
        CommunityStats targetStats = communityStats.get(targetCommunity);
        if (targetStats == null) {
            return 0.0;
        }

        long vertexDegree = graphStore.getOutDegree(vertexId) + graphStore.getInDegree(vertexId);

        long edgesToTarget = 0;
        for (Edge edge : graphStore.getOutEdges(vertexId)) {
            Long neighborCommunity = vertexToCommunity.get(edge.getToVertexId());
            if (neighborCommunity != null && neighborCommunity == targetCommunity) {
                edgesToTarget += edge.getWeight();
            }
        }
        for (Edge edge : graphStore.getInEdges(vertexId)) {
            Long neighborCommunity = vertexToCommunity.get(edge.getFromVertexId());
            if (neighborCommunity != null && neighborCommunity == targetCommunity) {
                edgesToTarget += edge.getWeight();
            }
        }

        if (totalEdgeWeight == 0) {
            return edgesToTarget;
        }

        double m2 = 2.0 * totalEdgeWeight;
        return edgesToTarget - resolution * vertexDegree * targetStats.getTotalDegree() / m2;
    }

    private void moveVertexToCommunity(long vertexId, long oldCommunity, long newCommunity) {
        vertexToCommunity.put(vertexId, newCommunity);

        CommunityStats oldStats = communityStats.get(oldCommunity);
        CommunityStats newStats = communityStats.computeIfAbsent(newCommunity, k -> new CommunityStats());

        if (oldStats != null) {
            oldStats.getVertices().remove(vertexId);
            oldStats.setTotalDegree(oldStats.getTotalDegree() - (graphStore.getOutDegree(vertexId) + graphStore.getInDegree(vertexId)));

            if (oldStats.getVertices().isEmpty()) {
                communityStats.remove(oldCommunity);
            }
        }

        newStats.getVertices().add(vertexId);
        newStats.setTotalDegree(newStats.getTotalDegree() + graphStore.getOutDegree(vertexId) + graphStore.getInDegree(vertexId));

        log.trace("Moved vertex {} from community {} to {}", vertexId, oldCommunity, newCommunity);
    }

    private Set<Long> expandUpdateSet(Set<Long> coreSet, int levels) {
        Set<Long> expanded = new HashSet<>(coreSet);
        Set<Long> currentLevel = new HashSet<>(coreSet);

        for (int i = 0; i < levels; i++) {
            Set<Long> nextLevel = new HashSet<>();
            for (long vertexId : currentLevel) {
                nextLevel.addAll(graphStore.getOutNeighbors(vertexId));
                nextLevel.addAll(graphStore.getInNeighbors(vertexId));
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

    private void mergeSmallCommunities() {
        int minSize = 2;
        Set<Long> smallCommunities = new HashSet<>();

        for (Map.Entry<Long, CommunityStats> entry : communityStats.entrySet()) {
            if (entry.getValue().getVertices().size() < minSize) {
                smallCommunities.add(entry.getKey());
            }
        }

        for (long communityId : smallCommunities) {
            CommunityStats stats = communityStats.get(communityId);
            if (stats != null && !stats.getVertices().isEmpty()) {
                long representative = stats.getVertices().iterator().next();
                long bestNeighborCommunity = findLargestNeighborCommunity(representative);

                if (bestNeighborCommunity != -1 && bestNeighborCommunity != communityId) {
                    for (long vertexId : new ArrayList<>(stats.getVertices())) {
                        moveVertexToCommunity(vertexId, communityId, bestNeighborCommunity);
                    }
                }
            }
        }
    }

    private long findLargestNeighborCommunity(long vertexId) {
        Map<Long, Integer> communityCounts = getNeighborCommunities(vertexId);
        long largestCommunity = -1;
        int maxSize = 0;

        for (Map.Entry<Long, Integer> entry : communityCounts.entrySet()) {
            CommunityStats stats = communityStats.get(entry.getKey());
            if (stats != null && stats.getVertices().size() > maxSize) {
                maxSize = stats.getVertices().size();
                largestCommunity = entry.getKey();
            }
        }

        return largestCommunity;
    }

    private void recalculateInternalEdges() {
        for (Map.Entry<Long, CommunityStats> entry : communityStats.entrySet()) {
            long communityId = entry.getKey();
            CommunityStats stats = entry.getValue();
            long internalEdges = 0;

            for (long vertexId : stats.getVertices()) {
                for (Edge edge : graphStore.getOutEdges(vertexId)) {
                    Long targetCommunity = vertexToCommunity.get(edge.getToVertexId());
                    if (targetCommunity != null && targetCommunity == communityId) {
                        internalEdges += edge.getWeight();
                    }
                }
            }

            stats.setInternalEdges(internalEdges);
        }
    }

    private long calculateTotalEdgeWeight() {
        long total = 0;
        for (long vertexId : vertexToCommunity.keySet()) {
            total += graphStore.getOutDegree(vertexId);
        }
        return total;
    }

    public Map<Long, Long> getCurrentCommunities() {
        return new HashMap<>(vertexToCommunity);
    }

    public long getVertexCommunity(long vertexId) {
        return vertexToCommunity.getOrDefault(vertexId, -1L);
    }

    public int getNumCommunities() {
        return communityStats.size();
    }

    public void setResolution(double resolution) {
        this.resolution = resolution;
    }

    public void setMaxLocalMoveIterations(int maxLocalMoveIterations) {
        this.maxLocalMoveIterations = maxLocalMoveIterations;
    }

    public void reset() {
        vertexToCommunity.clear();
        communityStats.clear();
        affectedVertices.clear();
        affectedCommunities.clear();
        totalEdgeWeight = 0;
    }
}