package com.graphdb.stream;

import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
public class GraphStreamProcessor {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private StreamingPageRank streamingPageRank;

    @Autowired
    private IncrementalCommunityDetection communityDetection;

    private SlidingWindow<EdgeId> edgeWindow;
    private final Map<EdgeId, Edge> edgeCache;

    private final AtomicLong edgesProcessed;
    private final AtomicLong edgesEvicted;
    private final AtomicLong updateCount;

    private long windowSizeMs = 60000;
    private long slideIntervalMs = 10000;
    private int autoUpdateIntervalMs = 5000;
    private boolean autoUpdateEnabled = true;
    private boolean initialized = false;

    private final List<StreamListener> listeners;

    public GraphStreamProcessor() {
        this.edgeCache = new ConcurrentHashMap<>();
        this.edgesProcessed = new AtomicLong(0);
        this.edgesEvicted = new AtomicLong(0);
        this.updateCount = new AtomicLong(0);
        this.listeners = new ArrayList<>();
    }

    @PostConstruct
    public void init() {
        edgeWindow = new SlidingWindow<>(windowSizeMs, slideIntervalMs);
        edgeWindow.addEvictionListener(this::handleEdgeEviction);
        log.info("Graph stream processor initialized with window size: {} ms, slide interval: {} ms",
                windowSizeMs, slideIntervalMs);
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down graph stream processor. Total edges processed: {}, evicted: {}",
                edgesProcessed.get(), edgesEvicted.get());
    }

    public void processEdge(Edge edge) {
        EdgeId edgeId = EdgeId.of(edge.getFromVertexId(), edge.getToVertexId(), edge.getLabel());

        if (!edgeCache.containsKey(edgeId)) {
            graphStore.addEdge(edge);
            edgeCache.put(edgeId, edge);

            streamingPageRank.onEdgeAdded(edge);
            communityDetection.onEdgeAdded(edge);

            notifyEdgeAdded(edge);
        }

        edgeWindow.add(edgeId);
        edgesProcessed.incrementAndGet();

        ensureVertexExists(edge.getFromVertexId());
        ensureVertexExists(edge.getToVertexId());
    }

    public void processEdges(Collection<Edge> edges) {
        for (Edge edge : edges) {
            processEdge(edge);
        }
    }

    private void handleEdgeEviction(Collection<EdgeId> evictedEdgeIds) {
        for (EdgeId edgeId : evictedEdgeIds) {
            Edge edge = edgeCache.remove(edgeId);
            if (edge != null) {
                streamingPageRank.onEdgeRemoved(edge);
                communityDetection.onEdgeRemoved(edge);

                graphStore.removeEdge(edge.getId());

                notifyEdgeRemoved(edge);
                edgesEvicted.incrementAndGet();
            }
        }

        log.debug("Evicted {} edges from sliding window", evictedEdgeIds.size());
    }

    private void ensureVertexExists(long vertexId) {
        if (graphStore.getVertex(vertexId) == null) {
            Vertex vertex = new Vertex(vertexId, "StreamNode");
            graphStore.addVertex(vertex);
        }
    }

    @Scheduled(fixedDelayString = "${graphdb.stream.auto-update-interval:5000}")
    public void scheduledUpdate() {
        if (autoUpdateEnabled && initialized) {
            performUpdate();
        }
    }

    public StreamProcessingResult performUpdate() {
        long startTime = System.currentTimeMillis();

        edgeWindow.evictExpired();

        Map<Long, Double> newPageRanks = streamingPageRank.updateIncremental();
        Map<Long, Long> newCommunities = communityDetection.updateCommunities();

        long duration = System.currentTimeMillis() - startTime;
        updateCount.incrementAndGet();

        StreamProcessingResult result = new StreamProcessingResult(
                newPageRanks,
                newCommunities,
                duration,
                edgeWindow.size(),
                updateCount.get()
        );

        notifyUpdateCompleted(result);

        log.info("Stream processing update completed in {} ms. Active edges: {}, Update count: {}",
                duration, edgeWindow.size(), updateCount.get());

        return result;
    }

    public void initializeFromGraph() {
        Set<Long> vertexIds = graphStore.getAllVertexIds();

        Map<Long, Double> initialPageRanks = new HashMap<>();
        Map<Long, Long> initialCommunities = new HashMap<>();

        double initialRank = 1.0 / Math.max(1, vertexIds.size());
        for (long vertexId : vertexIds) {
            initialPageRanks.put(vertexId, initialRank);
            initialCommunities.put(vertexId, vertexId);

            for (Edge edge : graphStore.getOutEdges(vertexId)) {
                EdgeId edgeId = EdgeId.of(edge.getFromVertexId(), edge.getToVertexId(), edge.getLabel());
                edgeCache.put(edgeId, edge);
                edgeWindow.add(edgeId);
            }
        }

        streamingPageRank.initialize(initialPageRanks);
        communityDetection.initialize(initialCommunities);

        initialized = true;
        log.info("Stream processor initialized from graph with {} vertices and {} edges",
                vertexIds.size(), edgeCache.size());
    }

    public double getVertexPageRank(long vertexId) {
        return streamingPageRank.getVertexRank(vertexId);
    }

    public long getVertexCommunity(long vertexId) {
        return communityDetection.getVertexCommunity(vertexId);
    }

    public Map<Long, Double> getCurrentPageRanks() {
        return streamingPageRank.getCurrentPageRanks();
    }

    public Map<Long, Long> getCurrentCommunities() {
        return communityDetection.getCurrentCommunities();
    }

    public long getEdgesProcessed() {
        return edgesProcessed.get();
    }

    public long getEdgesEvicted() {
        return edgesEvicted.get();
    }

    public long getActiveEdges() {
        return edgeWindow.size();
    }

    public long getUpdateCount() {
        return updateCount.get();
    }

    public void setWindowSizeMs(long windowSizeMs) {
        this.windowSizeMs = windowSizeMs;
        reinitializeWindow();
    }

    public void setSlideIntervalMs(long slideIntervalMs) {
        this.slideIntervalMs = slideIntervalMs;
        reinitializeWindow();
    }

    private void reinitializeWindow() {
        Collection<EdgeId> currentEdges = edgeWindow.getElements();
        edgeWindow = new SlidingWindow<>(windowSizeMs, slideIntervalMs);
        edgeWindow.addEvictionListener(this::handleEdgeEviction);
        edgeWindow.addAll(currentEdges);
    }

    public void setAutoUpdateEnabled(boolean enabled) {
        this.autoUpdateEnabled = enabled;
    }

    public boolean isAutoUpdateEnabled() {
        return autoUpdateEnabled;
    }

    public void addListener(StreamListener listener) {
        listeners.add(listener);
    }

    public void removeListener(StreamListener listener) {
        listeners.remove(listener);
    }

    private void notifyEdgeAdded(Edge edge) {
        for (StreamListener listener : listeners) {
            try {
                listener.onEdgeAdded(edge);
            } catch (Exception e) {
                log.error("Error in edge added listener", e);
            }
        }
    }

    private void notifyEdgeRemoved(Edge edge) {
        for (StreamListener listener : listeners) {
            try {
                listener.onEdgeRemoved(edge);
            } catch (Exception e) {
                log.error("Error in edge removed listener", e);
            }
        }
    }

    private void notifyUpdateCompleted(StreamProcessingResult result) {
        for (StreamListener listener : listeners) {
            try {
                listener.onUpdateCompleted(result);
            } catch (Exception e) {
                log.error("Error in update completed listener", e);
            }
        }
    }

    public void reset() {
        edgeWindow.clear();
        edgeCache.clear();
        streamingPageRank.reset();
        communityDetection.reset();
        edgesProcessed.set(0);
        edgesEvicted.set(0);
        updateCount.set(0);
        initialized = false;
        log.info("Stream processor reset");
    }

    public StreamStatistics getStatistics() {
        return new StreamStatistics(
                edgesProcessed.get(),
                edgesEvicted.get(),
                edgeWindow.size(),
                updateCount.get(),
                communityDetection.getNumCommunities()
        );
    }

    @Data
    public static class StreamProcessingResult {
        private final Map<Long, Double> pageRanks;
        private final Map<Long, Long> communities;
        private final long processingTimeMs;
        private final long activeEdges;
        private final long updateNumber;
    }

    @Data
    public static class StreamStatistics {
        private final long edgesProcessed;
        private final long edgesEvicted;
        private final long activeEdges;
        private final long updateCount;
        private final int numCommunities;
    }

    public interface StreamListener {
        default void onEdgeAdded(Edge edge) {}
        default void onEdgeRemoved(Edge edge) {}
        default void onUpdateCompleted(StreamProcessingResult result) {}
    }
}