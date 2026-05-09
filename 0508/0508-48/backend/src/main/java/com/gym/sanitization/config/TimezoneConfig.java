package com.gym.sanitization.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

@Configuration
public class TimezoneConfig {

    private static final Logger logger = LoggerFactory.getLogger(TimezoneConfig.class);

    public static final ZoneId ASIA_SHANGHAI = ZoneId.of("Asia/Shanghai");
    public static final String ASIA_SHANGHAI_STRING = "Asia/Shanghai";

    @PostConstruct
    void started() {
        TimeZone.setDefault(TimeZone.getTimeZone(ASIA_SHANGHAI));
        logger.info("System timezone set to: {}", ASIA_SHANGHAI_STRING);
    }

    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static LocalDateTime now() {
        return LocalDateTime.now(ASIA_SHANGHAI);
    }

    public static LocalDate today() {
        return LocalDate.now(ASIA_SHANGHAI);
    }

    public static LocalDateTime startOfToday() {
        return LocalDate.now(ASIA_SHANGHAI).atStartOfDay();
    }

    public static LocalDateTime endOfToday() {
        return LocalDate.now(ASIA_SHANGHAI).atTime(LocalTime.MAX);
    }

    public static LocalDateTime startOfTomorrow() {
        return LocalDate.now(ASIA_SHANGHAI).plusDays(1).atStartOfDay();
    }

    public static long secondsUntilTomorrow() {
        LocalDateTime now = now();
        LocalDateTime tomorrow = startOfTomorrow();
        return java.time.Duration.between(now, tomorrow).getSeconds();
    }

    public static LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    public static LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX);
    }

    public static String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    public static String formatDateTime(LocalDateTime dateTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return dateTime.format(formatter);
    }
}
