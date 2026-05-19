package com.graphdb;

import com.graphdb.algorithm.*;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AlgorithmTest {

    @Autowired
    private GraphStore graphStore;

    @Autowired
    private PageRank pageRank;

    @Autowired
    private LouvainCommunity louvainCommunity;

    @Autowired
    private BFSShortestPath bfsShortestPath;

    @Autowired
    private KCoreDecomposition kCoreDecomposition;

    @BeforeEach
    public void setup() {
        for (int i = 1; i <= 6; i++) {
            Vertex vertex = new Vertex(i, "Person");
            graphStore.addVertex(vertex);
        }

        graphStore.addEdge(new Edge(1, 2, "knows", 1.0));
        graphStore.addEdge(new Edge(1, 3, "knows", 1.0));
        graphStore.addEdge(new Edge(2, 3, "knows", 1.0));
        graphStore.addEdge(new Edge(2, 4, "knows", 1.0));
        graphStore.addEdge(new Edge(3, 4, "knows", 1.0));
        graphStore.addEdge(new Edge(4, 5, "knows", 1.0));
        graphStore.addEdge(new Edge(5, 6, "knows", 1.0));
        graphStore.addEdge(new Edge(6, 5, "knows", 1.0));
    }

    @Test
    public void testPageRank() {
        Map<Long, Double> result = pageRank.compute();
        assertNotNull(result);
        assertEquals(6, result.size());

        double sum = result.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(1.0, sum, 0.01);
    }

    @Test
    public void testLouvainCommunity() {
        LouvainCommunity.CommunityResult result = louvainCommunity.compute();
        assertNotNull(result);
        assertTrue(result.getNumCommunities() > 0);
        assertNotNull(result.getVertexToCommunity());
    }

    @Test
    public void testBFSShortestPath() {
        Map<Long, Integer> result = bfsShortestPath.compute(1L);
        assertNotNull(result);
        assertEquals(6, result.size());
        assertEquals(0, result.get(1L));
        assertEquals(1, result.get(2L));
        assertEquals(1, result.get(3L));
    }

    @Test
    public void testKCoreDecomposition() {
        Map<Long, Integer> result = kCoreDecomposition.compute();
        assertNotNull(result);
        assertEquals(6, result.size());
    }
}