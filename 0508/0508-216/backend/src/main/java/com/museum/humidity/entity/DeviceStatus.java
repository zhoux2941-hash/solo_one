package com.museum.humidity.entity;

public enum DeviceStatus {
    NORMAL("正常"),
    WARNING("警告"),
    HUMIDIFYING("加湿中"),
    DEHUMIDIFYING("除湿中");

    private final String description;

    DeviceStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
