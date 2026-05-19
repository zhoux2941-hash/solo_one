package com.graphdb.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vertex {

    private long id;
    private String label;
    private Map<String, Object> properties = new HashMap<>();

    public Vertex(long id) {
        this.id = id;
    }

    public Vertex(long id, String label) {
        this.id = id;
        this.label = label;
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