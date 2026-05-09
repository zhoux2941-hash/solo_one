package com.logistics.track.entity;

public enum TrackStatus {
    PICKUP("揽收"),
    IN_TRANSIT("运输中"),
    DISPATCH("派送"),
    SIGNED("签收");

    private final String description;

    TrackStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
