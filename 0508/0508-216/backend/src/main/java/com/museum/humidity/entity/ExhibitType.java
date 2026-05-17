package com.museum.humidity.entity;

public enum ExhibitType {
    ORGANIC("有机展品", 50.0, 55.0),
    INORGANIC("无机展品", 40.0, 45.0);

    private final String description;
    private final double defaultMinHumidity;
    private final double defaultMaxHumidity;

    ExhibitType(String description, double defaultMinHumidity, double defaultMaxHumidity) {
        this.description = description;
        this.defaultMinHumidity = defaultMinHumidity;
        this.defaultMaxHumidity = defaultMaxHumidity;
    }

    public String getDescription() {
        return description;
    }

    public double getDefaultMinHumidity() {
        return defaultMinHumidity;
    }

    public double getDefaultMaxHumidity() {
        return defaultMaxHumidity;
    }
}
