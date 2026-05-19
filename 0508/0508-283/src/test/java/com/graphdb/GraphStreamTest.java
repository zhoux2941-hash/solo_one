package com.graphdb;

import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import com.graphdb.stream.GraphStreamProcessor;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
@SpringBootTest
public class GraphStreamTest {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private GraphStreamProcessor streamProcessor;

    @BeforeEach
    public void setup() {
        streamProcessor.reset();
    }

    @Test
    public void testEdgeStreaming() {
        log.info("Testing edge streaming...");

        Edge edge1 = new Edge(1, 2, "LINK", 1.0);
        Edge edge2 = new Edge(2, 3, "LINK", 1.0);
        Edge edge3 = new Edge(3, 1, "LINK", 1.0);

        streamProcessor.processEdge(edge1);
        streamProcessor.processEdge(edge2);
        streamProcessor.processEdge(edge3);

        assertEquals(3, streamProcessor.getEdgesProcessed());
        assertEquals(3, streamProcessor.getActiveEdges());

        log.info("Edge streaming test passed!");
    }

    @Test
    public void testIncrementalPageRank() throws Exception {
        log.info("Testing incremental PageRank...");

        for (int i = 1; i <= 5; i++) {
            Vertex v = new Vertex(i, "Node");
            graphStore.addVertex(v);
        }

        streamProcessor.initializeFromGraph();

        Edge edge1 = new Edge(1, 2, "LINK", 1.0);
        Edge edge2 = new Edge(2, 3, "LINK", 1.0);
        Edge edge3 = new Edge(3, 4, "LINK", 1.0);
        Edge edge4 = new Edge(4, 5, "LINK", 1.0);
        Edge edge5 = new Edge(5, 1, "LINK", 1.0);

        streamProcessor.processEdge(edge1);
        streamProcessor.processEdge(edge2);
        streamProcessor.processEdge(edge3);
        streamProcessor.processEdge(edge4);
        streamProcessor.processEdge(edge5);

        GraphStreamProcessor.StreamProcessingResult result = streamProcessor.performUpdate();

        Map<Long, Double> pageRanks = result.getPageRanks();
        assertNotNull(pageRanks);
        assertFalse(pageRanks.isEmpty());

        double sum = pageRanks.values().stream().mapToDouble(Double::doubleValue).sum();
        assertTrue(sum > 0, "PageRank sum should be positive");

        log.info("Incremental PageRank test passed! Sum: {}", sum);
    }

    @Test
    public void testIncrementalCommunityDetection() throws Exception {
        log.info("Testing incremental community detection...");

        for (int i = 1; i <= 6; i++) {
            Vertex v = new Vertex(i, "Node");
            graphStore.addVertex(v);
        }

        streamProcessor.initializeFromGraph();

        Edge edge1 = new Edge(1, 2, "LINK", 1.0);
        Edge edge2 = new Edge(2, 3, "LINK", 1.0);
        Edge edge3 = new Edge(1, 3, "LINK", 1.0);
        Edge edge4 = new Edge(4, 5, "LINK", 1.0);
        Edge edge5 = new Edge(5, 6, "LINK", 1.0);
        Edge edge6 = new Edge(4, 6, "LINK", 1.0);

        streamProcessor.processEdge(edge1);
        streamProcessor.processEdge(edge2);
        streamProcessor.processEdge(edge3);
        streamProcessor.processEdge(edge4);
        streamProcessor.processEdge(edge5);
        streamProcessor.processEdge(edge6);

        GraphStreamProcessor.StreamProcessingResult result = streamProcessor.performUpdate();

        Map<Long, Long> communities = result.getCommunities();
        assertNotNull(communities);
        assertFalse(communities.isEmpty());

        long community1 = communities.get(1L);
        long community2 = communities.get(2L);
        long community3 = communities.get(3L);

        assertEquals(community1, community2, "Vertices 1 and 2 should be in the same community");
        assertEquals(community2, community3, "Vertices 2 and 3 should be in the same community");

        log.info("Incremental community detection test passed!");
    }

    @Test
    public void testSlidingWindowEviction() throws Exception {
        log.info("Testing sliding window eviction...");

        streamProcessor.setWindowSizeMs(1000);
        streamProcessor.setAutoUpdateEnabled(false);

        Edge edge1 = new Edge(1, 2, "LINK", 1.0);
        streamProcessor.processEdge(edge1);

        assertEquals(1, streamProcessor.getActiveEdges());

        Thread.sleep(1500);

        streamProcessor.performUpdate();

        assertEquals(0, streamProcessor.getActiveEdges());
        assertEquals(1, streamProcessor.getEdgesEvicted());

        log.info("Sliding window eviction test passed!");
    }

    @Test
    public void testStreamStatistics() {
        log.info("Testing stream statistics...");

        Edge edge1 = new Edge(1, 2, "LINK", 1.0);
        Edge edge2 = new Edge(2, 3, "LINK", 1.0);
        Edge edge3 = new Edge(3, 4, "LINK", 1.0);

        streamProcessor.processEdge(edge1);
        streamProcessor.processEdge(edge2);
        streamProcessor.processEdge(edge3);

        GraphStreamProcessor.StreamStatistics stats = streamProcessor.getStatistics();

        assertEquals(3, stats.getEdgesProcessed());
        assertEquals(3, stats.getActiveEdges());
        assertEquals(0, stats.getEdgesEvicted());

        log.info("Stream statistics test passed!");
    }

    @Test
    public void testDynamicCommunityChanges() throws Exception {
        log.info("Testing dynamic community changes...");

        for (int i = 1; i <= 6; i++) {
            Vertex v = new Vertex(i, "Node");
            graphStore.addVertex(v);
        }

        streamProcessor.initializeFromGraph();

        for (int i = 1; i <= 3; i++) {
            for (int j = i + 1; j <= 3; j++) {
                streamProcessor.processEdge(new Edge(i, j, "LINK", 1.0));
            }
        }
        for (int i = 4; i <= 6; i++) {
            for (int j = i + 1; j <= 6; j++) {
                streamProcessor.processEdge(new Edge(i, j, "LINK", 1.0));
            }
        }

        GraphStreamProcessor.StreamProcessingResult result1 = streamProcessor.performUpdate();
        int numCommunities1 = new HashSet<>(result1.getCommunities().values()).size();

        log.info("Initial communities: {}", numCommunities1);

        streamProcessor.processEdge(new Edge(3, 4, "LINK", 1.0));

        GraphStreamProcessor.StreamProcessingResult result2 = streamProcessor.performUpdate();
        int numCommunities2 = new HashSet<>(result2.getCommunities().values()).size();

        log.info("Communities after connecting edge: {}", numCommunities2);

        assertTrue(numCommunities2 <= numCommunities1,
                "Connecting communities should not increase community count");

        log.info("Dynamic community changes test passed!");
    }
}