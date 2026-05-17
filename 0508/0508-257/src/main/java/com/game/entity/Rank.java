package com.game.entity;

public enum Rank {
    BRONZE("青铜", 1),
    SILVER("白银", 2),
    GOLD("黄金", 3),
    PLATINUM("铂金", 4),
    DIAMOND("钻石", 5),
    MASTER("大师", 6),
    CHALLENGER("王者", 7);

    private final String displayName;
    private final int level;

    Rank(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getLevel() {
        return level;
    }

    public boolean isCloseRank(Rank other) {
        return Math.abs(this.level - other.level) <= 1;
    }
}