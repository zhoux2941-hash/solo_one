package com.museum.humidity.entity;

public enum ControlType {
    HUMIDIFY("加湿"),
    DEHUMIDIFY("除湿"),
    STOP("停止"),
    WARNING("警告");

    private final String description;

    ControlType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
