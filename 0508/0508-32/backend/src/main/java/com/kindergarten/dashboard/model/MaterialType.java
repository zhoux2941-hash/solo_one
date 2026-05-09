package com.kindergarten.dashboard.model;

public enum MaterialType {
    COLOR_PAPER("彩纸", "克"),
    GLUE("胶水", "毫升"),
    GLITTER("亮片", "克"),
    PIPE_CLEANER("毛根", "个");

    private final String displayName;
    private final String unit;

    MaterialType(String displayName, String unit) {
        this.displayName = displayName;
        this.unit = unit;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getUnit() {
        return unit;
    }
}
