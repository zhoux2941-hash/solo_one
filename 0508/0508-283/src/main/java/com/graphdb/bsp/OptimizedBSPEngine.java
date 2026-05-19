package com.graphdb.bsp;

import com.graphdb.config.GraphDBConfig;
import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

@Slf4j
@Component
public class OptimizedBSPEngine {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphDBConfig config;

    private final ExecutorService executorService;
    private final int numThreads;
    private final ThreadLocal<MessageBuffer<?>> threadLocalBuffer;

    public OptimizedBSPEngine() {
        this.numThreads = Runtime.getRuntime().availableProcessors();
        this.executorService = Executors.newFixedThreadPool(numThreads);
        this.threadLocalBuffer = new ThreadLocal<>();
    }

    public <V, E, M> Map<Long, V> execute(
            VertexComputeFunction<V, E, M> computeFunction,
            Class<V> vertexValueType,
            V initialValue,
            int maxSupersteps
    ) {
        Set<Long> vertexIds = graphStore.getAllVertexIds();
        long totalVertices = vertexIds.size();

        List<Long> vertexIdList = new ArrayList<>(vertexIds);
        List<List<Long>> partitions = partitionVertices(vertexIdList, numThreads);

        OptimizedBSPContext<V, E, M> context = new OptimizedBSPContext<>(totalVertices, numThreads);

        Map<Long, ComputeVertex<V, E, M>> vertexMap = new ConcurrentHashMap<>();
        for (long vertexId : vertexIds) {
            List<Edge> edges = graphStore.getOutEdges(vertexId);
            ComputeVertex<V, E, M> vertex = new ComputeVertex<>(vertexId) {
                @Override
                public void compute() {
                    computeFunction.compute(this, context);
                }
            };
            vertex.setVertexValue(initialValue);
            vertex.init(null, (List<E>) edges, context);
            vertexMap.put(vertexId, vertex);
        }

        context.setVertexMap(vertexMap);

        int actualMaxSupersteps = Math.min(maxSupersteps, config.getBsp().getMaxSupersteps());
        CyclicBarrier barrier = new CyclicBarrier(numThreads + 1);
        LongAdder activeVertexCount = new LongAdder();

        for (int superstep = 0; superstep < actualMaxSupersteps; superstep++) {
            context.startSuperstep(superstep);
            activeVertexCount.reset();

            CountDownLatch completionLatch = new CountDownLatch(numThreads);

            for (int partitionId = 0; partitionId < numThreads; partitionId++) {
                final int currentPartition = partitionId;
                final List<Long> partitionVertices = partitions.get(partitionId);

                executorService.submit(() -> {
                    try {
                        @SuppressWarnings("unchecked")
                        MessageBuffer<M> buffer = (MessageBuffer<M>) threadLocalBuffer.get();
                        if (buffer == null) {
                            buffer = new MessageBuffer<>();
                            threadLocalBuffer.set(buffer);
                        }
                        buffer.clear();

                        context.setThreadLocalBuffer(buffer, currentPartition);

                        int localActiveCount = 0;
                        for (long vertexId : partitionVertices) {
                            ComputeVertex<V, E, M> vertex = vertexMap.get(vertexId);
                            if (vertex != null && vertex.isActive()) {
                                vertex.compute();
                                localActiveCount++;
                            }
                        }

                        activeVertexCount.add(localActiveCount);

                        context.flushPartitionBuffer(currentPartition);

                    } catch (Exception e) {
                        log.error("Error processing partition {}", currentPartition, e);
                    } finally {
                        completionLatch.countDown();
                    }
                });
            }

            try {
                boolean completed = completionLatch.await(
                        config.getBsp().getBarrierTimeout(), TimeUnit.MILLISECONDS);
                if (!completed) {
                    log.warn("Superstep {} barrier timeout reached", superstep);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Superstep interrupted", e);
            }

            context.deliverMessages();

            int activeCount = activeVertexCount.intValue();
            log.debug("Superstep {} completed. Active vertices: {}", superstep, activeCount);

            if (activeCount == 0) {
                log.info("All vertices voted to halt. Terminating at superstep {}", superstep);
                break;
            }
        }

        for (MessageBuffer<?> buffer : threadLocalBuffer.withInitial(MessageBuffer::new).values()) {
            buffer.clear();
        }
        threadLocalBuffer.remove();

        return collectResults(vertexMap);
    }

    private <V, E, M> Map<Long, V> collectResults(Map<Long, ComputeVertex<V, E, M>> vertexMap) {
        Map<Long, V> results = new HashMap<>(vertexMap.size());
        for (Map.Entry<Long, ComputeVertex<V, E, M>> entry : vertexMap.entrySet()) {
            results.put(entry.getKey(), entry.getValue().getVertexValue());
        }
        return results;
    }

    private List<List<Long>> partitionVertices(List<Long> vertexIds, int numPartitions) {
        List<List<Long>> partitions = new ArrayList<>(numPartitions);
        int partitionSize = (vertexIds.size() + numPartitions - 1) / numPartitions;

        for (int i = 0; i < numPartitions; i++) {
            int start = i * partitionSize;
            int end = Math.min(start + partitionSize, vertexIds.size());
            partitions.add(new ArrayList<>(vertexIds.subList(start, end)));
        }

        log.debug("Partitioned {} vertices into {} partitions, average size: {}",
                vertexIds.size(), numPartitions, partitionSize);

        return partitions;
    }

    public void shutdown() {
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}