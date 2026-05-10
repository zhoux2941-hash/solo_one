package com.example.trashbin.common;

public enum GarbageType {
    RECYCLABLE("可回收", 2),
    KITCHEN("厨余", 1),
    HARMFUL("有害", 0),
    OTHER("其他", 0);

    private final String name;
    private final int pointsPerKg;

    GarbageType(String name, int pointsPerKg) {
        this.name = name;
        this.pointsPerKg = pointsPerKg;
    }

    public String getName() {
        return name;
    }

    public int getPointsPerKg() {
        return pointsPerKg;
    }

    public static int calculatePoints(String type, double weight) {
        try {
            GarbageType garbageType = valueOf(type);
            return (int) (weight * garbageType.pointsPerKg);
        } catch (IllegalArgumentException e) {
            return 0;
        }
    }
}
