package com.park.benchstats.enums;

import lombok.Getter;

@Getter
public enum WeatherType {
    SUNNY("SUNNY", "晴天", 1.2),
    CLOUDY("CLOUDY", "多云", 0.8),
    OVERCAST("OVERCAST", "阴天", 0.4);

    private final String code;
    private final String description;
    private final double sunFactor;

    WeatherType(String code, String description, double sunFactor) {
        this.code = code;
        this.description = description;
        this.sunFactor = sunFactor;
    }

    public static WeatherType fromCode(String code) {
        if (code == null) {
            return SUNNY;
        }
        for (WeatherType type : values()) {
            if (type.getCode().equalsIgnoreCase(code)) {
                return type;
            }
        }
        return SUNNY;
    }
}
