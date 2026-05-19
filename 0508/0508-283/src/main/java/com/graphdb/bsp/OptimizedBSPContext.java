package com.graphdb.bsp;

import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class OptimizedBSPContext<V, E, M> {

    private int superstep;
    private final long totalVertices;
    private final int numPartitions;
    private Map<Long, ComputeVertex<V, E, M>> vertexMap;

    private final MessageBuffer<M>[] partitionBuffers;
    private final Set<Long>[] partitionVertexSets;
    private final Map<Long, Integer> vertexToPartition;

    private final ThreadLocal<MessageBuffer<M>> threadLocalBuffer;
    private final ThreadLocal<Integer> threadPartitionId;

    private final AggregatorManager aggregatorManager;
    private final Map<String, Object> globalValues;

    @SuppressWarnings("unchecked")
    public OptimizedBSPContext(long totalVertices, int numPartitions) {
        this.totalVertices = totalVertices;
        this.numPartitions = numPartitions;
        this.partitionBuffers = new MessageBuffer[numPartitions];
        this.partitionVertexSets = new Set[numPartitions];
        this.vertexToPartition = new ConcurrentHashMap<>();

        for (int i = 0; i < numPartitions; i++) {
            partitionBuffers[i] = new MessageBuffer<>();
            partitionVertexSets[i] = Collections.newSetFromMap(new ConcurrentHashMap<>());
        }

        this.threadLocalBuffer = new ThreadLocal<>();
        this.threadPartitionId = new ThreadLocal<>();
        this.aggregatorManager = new AggregatorManager();
        this.globalValues = new ConcurrentHashMap<>();
        this.superstep = 0;
    }

    public void setVertexMap(Map<Long, ComputeVertex<V, E, M>> vertexMap) {
        this.vertexMap = vertexMap;
        assignVerticesToPartitions();
    }

    private void assignVerticesToPartitions() {
        int index = 0;
        for (long vertexId : vertexMap.keySet()) {
            int partitionId = index % numPartitions;
            vertexToPartition.put(vertexId, partitionId);
            partitionVertexSets[partitionId].add(vertexId);
            index++;
        }

        log.debug("Assigned {} vertices to {} partitions", vertexMap.size(), numPartitions);
    }

    public void setThreadLocalBuffer(MessageBuffer<M> buffer, int partitionId) {
        threadLocalBuffer.set(buffer);
        threadPartitionId.set(partitionId);
    }

    public void sendMessage(long targetVertexId, M message) {
        MessageBuffer<M> buffer = threadLocalBuffer.get();
        Integer sourcePartition = threadPartitionId.get();
        Integer targetPartition = vertexToPartition.get(targetVertexId);

        if (buffer == null) {
            buffer = new MessageBuffer<>();
            threadLocalBuffer.set(buffer);
        }

        if (sourcePartition != null && targetPartition != null && sourcePartition.equals(targetPartition)) {
            ComputeVertex<V, E, M> vertex = vertexMap.get(targetVertexId);
            if (vertex != null) {
                vertex.addMessage(message);
                if (!vertex.isActive()) {
                    vertex.wakeUp();
                }
            }
        } else {
            buffer.addMessage(targetVertexId, message);
        }
    }

    public void flushPartitionBuffer(int partitionId) {
        MessageBuffer<M> localBuffer = threadLocalBuffer.get();
        if (localBuffer != null && !localBuffer.isEmpty()) {
            partitionBuffers[partitionId].merge(localBuffer);
        }
    }

    public void deliverMessages() {
        long startTime = System.nanoTime();
        int totalMessages = 0;

        for (int i = 0; i < numPartitions; i++) {
            MessageBuffer<M> buffer = partitionBuffers[i];
            if (!buffer.isEmpty()) {
                for (Map.Entry<Long, List<M>> entry : buffer.getMessages().entrySet()) {
                    long vertexId = entry.getKey();
                    List<M> messages = entry.getValue();

                    ComputeVertex<V, E, M> vertex = vertexMap.get(vertexId);
                    if (vertex != null) {
                        for (M message : messages) {
                            vertex.addMessage(message);
                        }
                        if (!vertex.isActive() && !messages.isEmpty()) {
                            vertex.wakeUp();
                        }
                        totalMessages += messages.size();
                    }
                }
                buffer.clear();
            }
        }

        long duration = System.nanoTime() - startTime;
        if (totalMessages > 0) {
            log.debug("Delivered {} messages in {} ms",
                    totalMessages, duration / 1_000_000);
        }
    }

    public void startSuperstep(int superstepNumber) {
        this.superstep = superstepNumber;
        aggregatorManager.nextSuperstep();
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

    public ComputeVertex<V, E, M> getVertex(long vertexId) {
        return vertexMap.get(vertexId);
    }

    public Map<Long, ComputeVertex<V, E, M>> getVertices() {
        return vertexMap;
    }
}