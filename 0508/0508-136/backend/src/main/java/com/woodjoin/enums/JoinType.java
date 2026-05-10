package com.woodjoin.enums;

public enum JoinType {
    DOVETAIL("燕尾榫"),
    STRAIGHT("直榫"),
    CLAMP("夹头榫"),
    BOX("框榫"),
    LAP("搭接榫");

    private final String displayName;

    JoinType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}