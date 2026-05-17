package com.metro.inspection.entity;

public enum WorkOrderStatus {
    PENDING("待处理"),
    PROCESSING("处理中"),
    COMPLETED("已完成");

    private final String description;

    WorkOrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
