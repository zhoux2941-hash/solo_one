package com.metro.inspection.entity;

public enum LineSpeedLevel {
    SPEED_80(80, "80km/h", 5.0, 10.0),
    SPEED_100(100, "100km/h", 4.5, 9.0),
    SPEED_120(120, "120km/h", 4.0, 8.0);

    private final int speed;
    private final String description;
    private final double level1Threshold;
    private final double level2Threshold;

    LineSpeedLevel(int speed, String description, double level1Threshold, double level2Threshold) {
        this.speed = speed;
        this.description = description;
        this.level1Threshold = level1Threshold;
        this.level2Threshold = level2Threshold;
    }

    public int getSpeed() {
        return speed;
    }

    public String getDescription() {
        return description;
    }

    public double getLevel1Threshold() {
        return level1Threshold;
    }

    public double getLevel2Threshold() {
        return level2Threshold;
    }

    public static LineSpeedLevel fromSpeed(int speed) {
        for (LineSpeedLevel level : values()) {
            if (level.getSpeed() == speed) {
                return level;
            }
        }
        return SPEED_80;
    }

    public static LineSpeedLevel fromSection(String section) {
        if (section == null) return SPEED_80;
        
        if (section.contains("1号线")) {
            return SPEED_80;
        } else if (section.contains("2号线")) {
            return SPEED_120;
        }
        return SPEED_80;
    }
}
