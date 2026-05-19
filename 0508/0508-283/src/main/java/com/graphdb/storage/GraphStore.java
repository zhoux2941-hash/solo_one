package com.graphdb.storage;

import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface GraphStore {

    void addVertex(Vertex vertex);

    Vertex getVertex(long vertexId);

    void removeVertex(long vertexId);

    void addEdge(Edge edge);

    Edge getEdge(long edgeId);

    void removeEdge(long edgeId);

    List<Edge> getOutEdges(long vertexId);

    List<Edge> getInEdges(long vertexId);

    List<Long> getOutNeighbors(long vertexId);

    List<Long> getInNeighbors(long vertexId);

    int getOutDegree(long vertexId);

    int getInDegree(long vertexId);

    Set<Long> getAllVertexIds();

    long getVertexCount();

    long getEdgeCount();

    void updateVertexProperty(long vertexId, String key, Object value);

    void batchAddVertices(List<Vertex> vertices);

    void batchAddEdges(List<Edge> edges);
}