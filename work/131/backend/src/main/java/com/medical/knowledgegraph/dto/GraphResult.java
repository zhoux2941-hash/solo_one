package com.medical.knowledgegraph.dto;

import java.util.ArrayList;
import java.util.List;

public class GraphResult {
    private List<NodeData> nodes = new ArrayList<>();
    private List<EdgeData> edges = new ArrayList<>();

    public GraphResult() {
    }

    public List<NodeData> getNodes() {
        return nodes;
    }

    public void setNodes(List<NodeData> nodes) {
        this.nodes = nodes;
    }

    public List<EdgeData> getEdges() {
        return edges;
    }

    public void setEdges(List<EdgeData> edges) {
        this.edges = edges;
    }

    public void addNode(NodeData node) {
        this.nodes.add(node);
    }

    public void addEdge(EdgeData edge) {
        this.edges.add(edge);
    }
}