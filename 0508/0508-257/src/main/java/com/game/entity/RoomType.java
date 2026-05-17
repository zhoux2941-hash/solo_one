package com.game.entity;

public enum RoomType {
    PUBLIC("公开匹配"),
    PRIVATE("私密房间");

    private final String displayName;

    RoomType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}