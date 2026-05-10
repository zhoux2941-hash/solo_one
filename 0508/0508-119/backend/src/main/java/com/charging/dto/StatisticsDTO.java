package com.charging.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
public class StatisticsDTO {
    
    @Data
    public static class DailyUsage {
        private LocalDate date;
        private double usageRate;
        private int totalReservations;
        private int completedReservations;
        private int expiredReservations;
    }
    
    @Data
    public static class TimeSlotUsage {
        private int hour;
        private int minute;
        private int count;
        private double usageRate;
    }
    
    @Data
    public static class PileStatistics {
        private Long pileId;
        private String pileCode;
        private String location;
        private double totalUsageRate;
        private int totalReservations;
        private List<TimeSlotUsage> timeSlotUsages;
        private List<LocalTime> peakHours;
        private List<LocalTime> offPeakHours;
    }
    
    @Data
    public static class HeatmapData {
        private String pileCode;
        private Map<String, Double> hourlyUsage;
    }
    
    @Data
    public static class OverviewStatistics {
        private int totalPiles;
        private int availablePiles;
        private int occupiedPiles;
        private int maintenancePiles;
        private int todayReservations;
        private int todayCompletedReservations;
        private double todayUsageRate;
        private double averageUsageRate;
        private LocalTime busiestHour;
        private LocalTime quietestHour;
    }
}
