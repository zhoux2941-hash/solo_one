package com.applauncher.model;

public enum SortType {
    MANUAL("手动排序"),
    LAST_LAUNCH_TIME("最近打开"),
    LAUNCH_COUNT("使用频率"),
    NAME("名称");

    private final String displayName;

    SortType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
