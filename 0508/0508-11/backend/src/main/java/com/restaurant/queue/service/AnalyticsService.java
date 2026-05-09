package com.restaurant.queue.service;

import com.restaurant.queue.repository.QueueRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {

    private final QueueRecordRepository queueRecordRepository;

    @Value("${restaurant.queue.table-config.small.count:5}")
    private int smallTableCount;

    @Value("${restaurant.queue.table-config.medium.count:3}")
    private int mediumTableCount;

    public Map<String, Object> getTrafficHeatmap(int days, Long restaurantId) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(days, ChronoUnit.DAYS);

        List<Object[]> countByHour = queueRecordRepository.countByHourAndRestaurant(restaurantId, startTime);
        List<Object[]> avgWaitByHour = queueRecordRepository.avgWaitTimeByHourAndRestaurant(restaurantId, startTime);

        Map<Integer, Long> countMap = new HashMap<>();
        Map<Integer, Double> waitMap = new HashMap<>();

        for (Object[] row : countByHour) {
            Integer hour = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            countMap.put(hour, count);
        }

        for (Object[] row : avgWaitByHour) {
            Integer hour = ((Number) row[0]).intValue();
            Double avgWait = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            waitMap.put(hour, avgWait);
        }

        List<Map<String, Object>> hourlyData = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            Map<String, Object> data = new HashMap<>();
            data.put("hour", hour);
            data.put("queueCount", countMap.getOrDefault(hour, 0L));
            data.put("avgWaitMinutes", waitMap.getOrDefault(hour, 0.0));
            hourlyData.add(data);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("periodDays", days);
        result.put("hourlyData", hourlyData);

        return result;
    }

    public Map<String, Object> getTurnoverRateStatistics(int hours, Long restaurantId) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        LocalDateTime startTime = LocalDateTime.now().minus(hours, ChronoUnit.HOURS);
        List<Object[]> completedByHour = queueRecordRepository.countCompletedByHourAndRestaurant(restaurantId, startTime);

        Map<Integer, Long> completedMap = new HashMap<>();
        for (Object[] row : completedByHour) {
            Integer hour = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            completedMap.put(hour, count);
        }

        Long smallCompleted = queueRecordRepository.countCompletedSmallTablesByRestaurant(restaurantId);
        Long mediumCompleted = queueRecordRepository.countCompletedMediumTablesByRestaurant(restaurantId);

        if (smallCompleted == null) smallCompleted = 0L;
        if (mediumCompleted == null) mediumCompleted = 0L;

        List<Map<String, Object>> hourlyTurnover = new ArrayList<>();
        int currentHour = LocalDateTime.now().getHour();
        for (int i = 0; i < hours; i++) {
            int hour = (currentHour - hours + 1 + i + 24) % 24;
            Map<String, Object> data = new HashMap<>();
            data.put("hour", hour);
            data.put("completedCount", completedMap.getOrDefault(hour, 0L));
            data.put("totalTables", smallTableCount + mediumTableCount);
            hourlyTurnover.add(data);
        }

        Map<String, Object> tableTypeStats = new HashMap<>();

        Map<String, Object> smallTableStats = new HashMap<>();
        smallTableStats.put("tableType", "2人桌");
        smallTableStats.put("tableCount", smallTableCount);
        smallTableStats.put("completedOrders", smallCompleted);
        smallTableStats.put("turnoverRate", smallTableCount > 0 ? 
                (double) smallCompleted / (double) smallTableCount / (hours / 24.0) : 0.0);
        tableTypeStats.put("small", smallTableStats);

        Map<String, Object> mediumTableStats = new HashMap<>();
        mediumTableStats.put("tableType", "4人桌");
        mediumTableStats.put("tableCount", mediumTableCount);
        mediumTableStats.put("completedOrders", mediumCompleted);
        mediumTableStats.put("turnoverRate", mediumTableCount > 0 ? 
                (double) mediumCompleted / (double) mediumTableCount / (hours / 24.0) : 0.0);
        tableTypeStats.put("medium", mediumTableStats);

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("periodHours", hours);
        result.put("hourlyTurnover", hourlyTurnover);
        result.put("tableTypeStats", tableTypeStats);

        return result;
    }

    public Map<String, Object> getOverviewStatistics(Long restaurantId) {
        restaurantId = restaurantId != null ? restaurantId : QueueService.DEFAULT_RESTAURANT_ID;
        
        Long smallCompleted = queueRecordRepository.countCompletedSmallTablesByRestaurant(restaurantId);
        Long mediumCompleted = queueRecordRepository.countCompletedMediumTablesByRestaurant(restaurantId);
        Long totalCompleted = (smallCompleted != null ? smallCompleted : 0L) + 
                              (mediumCompleted != null ? mediumCompleted : 0L);
        Long activeQueues = queueRecordRepository.countActiveQueuesByRestaurant(restaurantId);

        Map<String, Object> result = new HashMap<>();
        result.put("restaurantId", restaurantId);
        result.put("totalCompleted", totalCompleted);
        result.put("activeQueues", activeQueues != null ? activeQueues : 0L);
        result.put("totalTables", smallTableCount + mediumTableCount);

        return result;
    }
}
