package com.medical.knowledgegraph.dto;

public class NodeData {
    private String id;
    private String label;
    private String type;
    private String description;
    private Object data;

    public NodeData() {
    }

    public NodeData(String id, String label, String type, String description, Object data) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.description = description;
        this.data = data;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}