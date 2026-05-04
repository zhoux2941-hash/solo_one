package com.medical.knowledgegraph.dto;

public class EdgeData {
    private String id;
    private String source;
    private String target;
    private String label;
    private String type;

    public EdgeData() {
    }

    public EdgeData(String id, String source, String target, String label, String type) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.label = label;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
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
}