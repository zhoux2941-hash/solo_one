package com.game.entity;

public enum GameMode {
    MODE_1V1("1v1", 2),
    MODE_2V2("2v2", 4),
    MODE_3V3("3v3", 6),
    MODE_5V5("5v5", 10);

    private final String displayName;
    private final int maxPlayers;

    GameMode(String displayName, int maxPlayers) {
        this.displayName = displayName;
        this.maxPlayers = maxPlayers;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }
}