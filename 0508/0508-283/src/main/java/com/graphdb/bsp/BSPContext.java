package com.graphdb.bsp;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class BSPContext<V, E, M> {

    private int superstep;
    private final long totalVertices;
    private final Map<Long, ComputeVertex<V, E, M>> vertices;
    private final Map<Long, ComputeVertex<V, E, M>> nextSuperstepVertices;
    private final Map<Long, Boolean> activeStatus;
    private final AggregatorManager aggregatorManager;
    private final Map<String, Object> globalValues;

    public BSPContext(long totalVertices) {
        this.totalVertices = totalVertices;
        this.vertices = new ConcurrentHashMap<>();
        this.nextSuperstepVertices = new ConcurrentHashMap<>();
        this.activeStatus = new ConcurrentHashMap<>();
        this.aggregatorManager = new AggregatorManager();
        this.globalValues = new ConcurrentHashMap<>();
        this.superstep = 0;
    }

    public void sendMessage(long targetVertexId, M message) {
        ComputeVertex<V, E, M> vertex = nextSuperstepVertices.get(targetVertexId);
        if (vertex != null) {
            vertex.addMessage(message);
            if (!vertex.isActive()) {
                vertex.wakeUp();
                activeStatus.put(targetVertexId, true);
            }
        }
    }

    public void nextSuperstep() {
        superstep++;
        for (Map.Entry<Long, ComputeVertex<V, E, M>> entry : nextSuperstepVertices.entrySet()) {
            vertices.put(entry.getKey(), entry.getValue());
        }
        nextSuperstepVertices.clear();
        activeStatus.clear();
        aggregatorManager.nextSuperstep();
    }

    public void registerVertex(ComputeVertex<V, E, M> vertex) {
        nextSuperstepVertices.put(vertex.getVertexId(), vertex);
        activeStatus.put(vertex.getVertexId(), vertex.isActive());
    }

    public boolean hasActiveVertices() {
        return activeStatus.values().stream().anyMatch(Boolean::booleanValue);
    }

    public int getActiveVertexCount() {
        return (int) activeStatus.values().stream().filter(Boolean::booleanValue).count();
    }

    public Map<Long, ComputeVertex<V, E, M>> getVertices() {
        return vertices;
    }

    public ComputeVertex<V, E, M> getVertex(long vertexId) {
        return vertices.get(vertexId);
    }

    public int getSuperstep() {
        return superstep;
    }

    public long getTotalVertices() {
        return totalVertices;
    }

    public AggregatorManager getAggregatorManager() {
        return aggregatorManager;
    }

    public void setGlobalValue(String key, Object value) {
        globalValues.put(key, value);
    }

    @SuppressWarnings("unchecked")
    public <T> T getGlobalValue(String key) {
        return (T) globalValues.get(key);
    }

    public void aggregate(String name, double value) {
        aggregatorManager.aggregate(name, value);
    }

    public double getAggregatedValue(String name) {
        return aggregatorManager.getAggregatedValue(name);
    }
}