package com.buscompany.fatigue.service;

import com.buscompany.fatigue.entity.Alert;
import com.buscompany.fatigue.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportService {
    @Autowired
    private AlertRepository alertRepository;

    public List<Map<String, Object>> getDriverAlertRanking(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = alertRepository.findAlertRanking(startTime, endTime);
        List<Map<String, Object>> ranking = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("driverNo", row[0]);
            item.put("driverName", row[1]);
            item.put("alertCount", row[2]);
            ranking.add(item);
        }

        return ranking;
    }

    public Map<Integer, Integer> getAlertByHour(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = alertRepository.findAlertByHour(startTime, endTime);
        Map<Integer, Integer> hourStats = new LinkedHashMap<>();

        for (int i = 0; i < 24; i++) {
            hourStats.put(i, 0);
        }

        for (Object[] row : results) {
            Integer hour = ((Number) row[0]).intValue();
            Integer count = ((Number) row[1]).intValue();
            hourStats.put(hour, count);
        }

        return hourStats;
    }

    public List<Alert> getRecentAlerts(int limit) {
        List<Alert> allAlerts = alertRepository.findAll();
        allAlerts.sort((a, b) -> b.getAlertTime().compareTo(a.getAlertTime()));
        return allAlerts.size() > limit ? allAlerts.subList(0, limit) : allAlerts;
    }

    public Map<String, Object> getDashboardStats() {
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<Alert> todayAlerts = alertRepository.findAlertRanking(today, LocalDateTime.now())
                .stream().mapToInt(row -> ((Number) row[2]).intValue()).boxed()
                .reduce((a, b) -> a + b).map(count -> {
                    List<Alert> list = new ArrayList<>();
                    for (int i = 0; i < count; i++) list.add(new Alert());
                    return list;
                }).orElse(new ArrayList<>());

        Map<String, Object> stats = new HashMap<>();
        stats.put("todayAlerts", alertRepository.findAlertRanking(today, LocalDateTime.now())
                .stream().mapToInt(row -> ((Number) row[2]).intValue()).sum());
        stats.put("unhandledAlerts", alertRepository.findByHandledFalseOrderByAlertTimeDesc().size());

        return stats;
    }
}
