package com.astro.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private Observatory observatory;
    private Booking booking;
    private Cache cache;

    @Data
    public static class Observatory {
        private double latitude;
        private double longitude;
        private double elevation;
    }

    @Data
    public static class Booking {
        private int startHour;
        private int endHour;
        private int slotMinutes;
        private double horizonElevation;
    }

    @Data
    public static class Cache {
        private int daysAhead;
    }
}
