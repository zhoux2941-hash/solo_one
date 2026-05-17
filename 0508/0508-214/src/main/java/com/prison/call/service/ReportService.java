package com.prison.call.service;

import com.prison.call.repository.AlertRepository;
import com.prison.call.repository.CallRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {
    
    @Autowired
    private CallRecordRepository callRecordRepository;
    
    @Autowired
    private AlertRepository alertRepository;
    
    public Map<String, Object> getPrisonAreaCallStats() {
        List<Object[]> results = callRecordRepository.countByPrisonArea();
        List<Map<String, Object>> stats = new ArrayList<>();
        
        for (Object[] result : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("prisonArea", result[0]);
            item.put("callCount", result[1]);
            stats.add(item);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", stats);
        return response;
    }
    
    public Map<String, Object> getCallTrendStats(int days) {
        LocalDateTime startDate = LocalDateTime.of(LocalDate.now().minusDays(days - 1), LocalTime.MIN);
        List<Object[]> results = callRecordRepository.countByDate(startDate);
        
        List<Map<String, Object>> stats = new ArrayList<>();
        Map<String, Long> dateMap = new HashMap<>();
        
        for (Object[] result : results) {
            String date = result[0].toString();
            Long count = ((Number) result[1]).longValue();
            dateMap.put(date, count);
        }
        
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.toString();
            Map<String, Object> item = new HashMap<>();
            item.put("date", dateStr);
            item.put("callCount", dateMap.getOrDefault(dateStr, 0L));
            stats.add(item);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", stats);
        return response;
    }
    
    public Map<String, Object> getAlertTrendStats(int days) {
        LocalDateTime startDate = LocalDateTime.of(LocalDate.now().minusDays(days - 1), LocalTime.MIN);
        List<Object[]> results = alertRepository.countByDate(startDate);
        
        List<Map<String, Object>> stats = new ArrayList<>();
        Map<String, Long> dateMap = new HashMap<>();
        
        for (Object[] result : results) {
            String date = result[0].toString();
            Long count = ((Number) result[1]).longValue();
            dateMap.put(date, count);
        }
        
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.toString();
            Map<String, Object> item = new HashMap<>();
            item.put("date", dateStr);
            item.put("alertCount", dateMap.getOrDefault(dateStr, 0L));
            stats.add(item);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", stats);
        return response;
    }
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalCalls = callRecordRepository.count();
        long totalAlerts = alertRepository.count();
        long pendingAlerts = alertRepository.findByStatus("PENDING").size();
        
        stats.put("totalCalls", totalCalls);
        stats.put("totalAlerts", totalAlerts);
        stats.put("pendingAlerts", pendingAlerts);
        
        return stats;
    }
}
