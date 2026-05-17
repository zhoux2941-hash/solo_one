package com.logistics.park.entity;

public enum Role {
    ADMIN("管理员"),
    DISPATCHER("调度员"),
    WAREHOUSE_KEEPER("仓管员");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
