package com.logistics.track.data;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
public enum CityCenterConfig {
    
    BEIJING("北京", "北京转运中心", 39.9042, 116.4074),
    SHANGHAI("上海", "上海转运中心", 31.2304, 121.4737),
    GUANGZHOU("广州", "广州转运中心", 23.1291, 113.2644),
    SHENZHEN("深圳", "深圳转运中心", 22.5431, 114.0579),
    CHENGDU("成都", "成都转运中心", 30.5728, 104.0668),
    HANGZHOU("杭州", "杭州转运中心", 30.2741, 120.1551),
    WUHAN("武汉", "武汉转运中心", 30.5928, 114.3055),
    XIAN("西安", "西安转运中心", 34.3416, 108.9398),
    NANJING("南京", "南京转运中心", 32.0603, 118.7969),
    CHONGQING("重庆", "重庆转运中心", 29.4316, 106.9123);

    private final String cityName;
    private final String centerName;
    private final double latitude;
    private final double longitude;

    CityCenterConfig(String cityName, String centerName, double latitude, double longitude) {
        this.cityName = cityName;
        this.centerName = centerName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public static List<CityCenterConfig> getAllCenters() {
        return Arrays.asList(values());
    }

    public static CityCenterConfig findByCityName(String cityName) {
        for (CityCenterConfig center : values()) {
            if (center.getCityName().equals(cityName)) {
                return center;
            }
        }
        return null;
    }

    public static CityCenterConfig findByCenterName(String centerName) {
        for (CityCenterConfig center : values()) {
            if (center.getCenterName().equals(centerName)) {
                return center;
            }
        }
        return null;
    }
}
