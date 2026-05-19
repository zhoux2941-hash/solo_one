package com.graphdb;

import com.graphdb.algorithm.PageRank;
import com.graphdb.bsp.BSPEngine;
import com.graphdb.bsp.OptimizedBSPEngine;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;

@Slf4j
@SpringBootTest
public class BSPPerformanceTest {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private BSPEngine bspEngine;

    @Autowired
    private OptimizedBSPEngine optimizedBSPEngine;

    @Autowired
    private PageRank pageRank;

    @BeforeEach
    public void setup() {
        log.info("Setting up test graph...");
    }

    @AfterEach
    public void cleanup() {
        log.info("Test completed");
    }

    @Test
    public void testSmallGraphPerformance() {
        int numVertices = 1000;
        int edgesPerVertex = 10;
        generateGraph(numVertices, edgesPerVertex);

        log.info("=== Testing Small Graph ({} vertices, {} edges) ===",
                numVertices, numVertices * edgesPerVertex);

        long startOriginal = System.nanoTime();
        Map<Long, Double> originalResult = pageRank.compute();
        long timeOriginal = System.nanoTime() - startOriginal;

        log.info("Original BSP - Time: {} ms, Sum of ranks: {}",
                timeOriginal / 1_000_000,
                originalResult.values().stream().mapToDouble(Double::doubleValue).sum());
    }

    @Test
    public void testMessageOptimizationEffect() {
        int numVertices = 5000;
        int edgesPerVertex = 20;
        generateGraph(numVertices, edgesPerVertex);

        log.info("=== Testing Message Optimization Effect ===");

        Runtime runtime = Runtime.getRuntime();
        System.gc();

        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        long start = System.nanoTime();

        Map<Long, Double> result = pageRank.compute();

        long time = System.nanoTime() - start;
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;

        log.info("Execution time: {} ms", time / 1_000_000);
        log.info("Memory used: {} MB", memoryUsed / (1024 * 1024));
        log.info("Sum of PageRank values: {}",
                result.values().stream().mapToDouble(Double::doubleValue).sum());

        double sum = result.values().stream().mapToDouble(Double::doubleValue).sum();
        assert Math.abs(sum - 1.0) < 0.01 : "PageRank sum should be close to 1.0";
    }

    private void generateGraph(int numVertices, int edgesPerVertex) {
        List<Vertex> vertices = new ArrayList<>();
        for (int i = 1; i <= numVertices; i++) {
            Vertex v = new Vertex(i, "Node");
            vertices.add(v);
        }
        graphStore.batchAddVertices(vertices);

        List<Edge> edges = new ArrayList<>();
        Random random = new Random(42);

        for (int i = 1; i <= numVertices; i++) {
            Set<Long> targets = new HashSet<>();
            while (targets.size() < edgesPerVertex) {
                long target = random.nextInt(numVertices) + 1;
                if (target != i) {
                    targets.add(target);
                }
            }
            for (long target : targets) {
                Edge edge = new Edge(i, target, "LINK");
                edge.setWeight(1.0);
                edges.add(edge);
            }
        }

        graphStore.batchAddEdges(edges);
        log.info("Generated graph with {} vertices and {} edges", numVertices, edges.size());
    }

    @Test
    public void testScalability() {
        int[] vertexCounts = {100, 500, 1000, 2000};

        log.info("=== Testing Scalability ===");

        for (int count : vertexCounts) {
            generateGraph(count, 10);

            long start = System.nanoTime();
            Map<Long, Double> result = pageRank.compute();
            long time = System.nanoTime() - start;

            log.info("Vertices: {} - Time: {} ms", count, time / 1_000_000);

            for (long id = 1L; id <= count; id++) {
                graphStore.removeVertex(id);
            }
        }
    }
}