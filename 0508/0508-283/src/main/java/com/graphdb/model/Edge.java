package com.graphdb.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Edge {

    private long id;
    private long fromVertexId;
    private long toVertexId;
    private String label;
    private double weight = 1.0;
    private Map<String, Object> properties = new HashMap<>();

    public Edge(long fromVertexId, long toVertexId, String label) {
        this.fromVertexId = fromVertexId;
        this.toVertexId = toVertexId;
        this.label = label;
    }

    public Edge(long fromVertexId, long toVertexId, String label, double weight) {
        this.fromVertexId = fromVertexId;
        this.toVertexId = toVertexId;
        this.label = label;
        this.weight = weight;
    }

    @SuppressWarnings("unchecked")
    public <T> T getProperty(String key) {
        return (T) properties.get(key);
    }

    public void setProperty(String key, Object value) {
        properties.put(key, value);
    }

    public void removeProperty(String key) {
        properties.remove(key);
    }
}