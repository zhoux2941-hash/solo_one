package com.graphdb.bsp;

import com.graphdb.config.GraphDBConfig;
import com.graphdb.model.Edge;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class BSPEngine {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphDBConfig config;

    private final ExecutorService executorService;
    private final int numThreads;

    public BSPEngine() {
        this.numThreads = Runtime.getRuntime().availableProcessors();
        this.executorService = Executors.newFixedThreadPool(numThreads);
    }

    public <V, E, M> Map<Long, V> execute(
            VertexComputeFunction<V, E, M> computeFunction,
            Class<V> vertexValueType,
            V initialValue,
            int maxSupersteps
    ) {
        Set<Long> vertexIds = graphStore.getAllVertexIds();
        long totalVertices = vertexIds.size();

        BSPContext<V, E, M> context = new BSPContext<>(totalVertices);

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
            context.registerVertex(vertex);
        }

        context.nextSuperstep();

        int actualMaxSupersteps = Math.min(maxSupersteps, config.getBsp().getMaxSupersteps());

        for (int superstep = 0; superstep < actualMaxSupersteps; superstep++) {
            if (!context.hasActiveVertices()) {
                log.info("All vertices voted to halt. Terminating at superstep {}", superstep);
                break;
            }

            log.debug("Starting superstep {}. Active vertices: {}",
                    superstep, context.getActiveVertexCount());

            processSuperstep(context);

            context.nextSuperstep();
        }

        return collectResults(context);
    }

    private <V, E, M> void processSuperstep(BSPContext<V, E, M> context) {
        List<ComputeVertex<V, E, M>> vertices = new ArrayList<>(context.getVertices().values());
        int batchSize = (vertices.size() + numThreads - 1) / numThreads;

        CountDownLatch latch = new CountDownLatch(numThreads);
        AtomicInteger processedCount = new AtomicInteger(0);

        for (int i = 0; i < numThreads; i++) {
            int startIndex = i * batchSize;
            int endIndex = Math.min(startIndex + batchSize, vertices.size());

            executorService.submit(() -> {
                try {
                    for (int j = startIndex; j < endIndex; j++) {
                        ComputeVertex<V, E, M> vertex = vertices.get(j);
                        if (vertex.isActive()) {
                            vertex.compute();
                            processedCount.incrementAndGet();
                        }
                        context.registerVertex(vertex);
                    }
                } catch (Exception e) {
                    log.error("Error processing vertex batch", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        try {
            boolean completed = latch.await(config.getBsp().getBarrierTimeout(), TimeUnit.MILLISECONDS);
            if (!completed) {
                log.warn("Superstep barrier timeout reached");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Superstep interrupted", e);
        }

        log.debug("Processed {} vertices in this superstep", processedCount.get());
    }

    private <V, E, M> Map<Long, V> collectResults(BSPContext<V, E, M> context) {
        Map<Long, V> results = new ConcurrentHashMap<>();
        for (Map.Entry<Long, ComputeVertex<V, E, M>> entry : context.getVertices().entrySet()) {
            results.put(entry.getKey(), entry.getValue().getVertexValue());
        }
        return results;
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