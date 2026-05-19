package com.community.buying.service;

import com.community.buying.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StatisticsService {

    @Autowired
    private OrderRepository orderRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    @Cacheable(value = "dashboardStats", key = "'stats:' + #root.target.calculateCacheKey()", unless = "#result == null")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);

        List<Object[]> todayStats = orderRepository.findDailyStatistics(todayStart, todayEnd);
        List<Object[]> monthStats = orderRepository.findDailyStatistics(monthStart, todayEnd);

        Long todayOrders = 0L;
        BigDecimal todayAmount = BigDecimal.ZERO;
        if (!todayStats.isEmpty()) {
            Object[] row = todayStats.get(0);
            todayOrders = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            todayAmount = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
        }

        Long monthOrders = 0L;
        BigDecimal monthAmount = BigDecimal.ZERO;
        for (Object[] row : monthStats) {
            monthOrders += row[1] != null ? ((Number) row[1]).longValue() : 0L;
            monthAmount = monthAmount.add(row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO);
        }

        stats.put("todayOrders", todayOrders);
        stats.put("monthOrders", monthOrders);
        stats.put("todayAmount", todayAmount);
        stats.put("monthAmount", monthAmount);

        return stats;
    }

    @Cacheable(value = "orderTrend", key = "'days:' + #days", unless = "#result == null or #result.isEmpty()")
    public List<Map<String, Object>> getOrderTrend(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        List<Object[]> statistics = orderRepository.findDailyStatisticsJPQL(start, end);

        Map<String, Object[]> statMap = new HashMap<>();
        for (Object[] row : statistics) {
            String dateStr = row[0].toString();
            statMap.put(dateStr, row);
        }

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            String dateStr = date.toString();

            Map<String, Object> item = new HashMap<>();
            item.put("date", dateStr);

            Object[] row = statMap.get(dateStr);
            if (row != null) {
                item.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
                item.put("amount", row[2] != null ? row[2] : BigDecimal.ZERO);
            } else {
                item.put("count", 0L);
                item.put("amount", BigDecimal.ZERO);
            }
            trend.add(item);
        }

        return trend;
    }

    @Cacheable(value = "monthlyStats", key = "'months:' + #months", unless = "#result == null or #result.isEmpty()")
    public List<Map<String, Object>> getMonthlyStatistics(int months) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(months - 1).withDayOfMonth(1);
        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        List<Object[]> statistics = orderRepository.findMonthlyStatisticsJPQL(start, end);

        Map<String, Object[]> statMap = new HashMap<>();
        for (Object[] row : statistics) {
            int year = row[0] != null ? ((Number) row[0]).intValue() : 0;
            int month = row[1] != null ? ((Number) row[1]).intValue() : 0;
            String monthKey = String.format("%04d-%02d", year, month);
            statMap.put(monthKey, row);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            LocalDate currentDate = startDate.plusMonths(i);
            String monthKey = currentDate.format(MONTH_FORMATTER);

            Map<String, Object> item = new HashMap<>();
            item.put("month", monthKey);

            Object[] row = statMap.get(monthKey);
            if (row != null) {
                item.put("count", row[2] != null ? ((Number) row[2]).longValue() : 0L);
                item.put("amount", row[3] != null ? row[3] : BigDecimal.ZERO);
            } else {
                item.put("count", 0L);
                item.put("amount", BigDecimal.ZERO);
            }
            result.add(item);
        }

        return result;
    }

    public String calculateCacheKey() {
        return LocalDate.now().toString();
    }
}