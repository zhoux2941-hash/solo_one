package com.game.entity;

public enum RoomStatus {
    WAITING("等待中"),
    MATCHING("匹配中"),
    PLAYING("游戏中"),
    FINISHED("已结束"),
    DISBANDED("已解散");

    private final String displayName;

    RoomStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}