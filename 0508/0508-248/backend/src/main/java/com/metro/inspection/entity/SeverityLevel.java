package com.metro.inspection.entity;

public enum SeverityLevel {
    LEVEL1("Ⅰ级"),
    LEVEL2("Ⅱ级"),
    LEVEL3("Ⅲ级");

    private final String description;

    SeverityLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
