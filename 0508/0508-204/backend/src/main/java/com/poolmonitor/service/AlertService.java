package com.poolmonitor.service;

import com.poolmonitor.entity.AlertRecord;
import com.poolmonitor.repository.AlertRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AlertService {

    @Autowired
    private AlertRecordRepository alertRecordRepository;

    public List<AlertRecord> getAllAlerts() {
        return alertRecordRepository.findAllOrderByAlertTimeDesc();
    }

    public List<AlertRecord> getUnhandledAlerts() {
        return alertRecordRepository.findByIsHandledOrderByAlertTimeDesc(false);
    }

    public List<AlertRecord> getRecentAlerts() {
        return alertRecordRepository.findTop10ByOrderByAlertTimeDesc();
    }

    @Transactional
    public AlertRecord handleAlert(Long id, String handler, String handleMeasure) {
        AlertRecord alert = alertRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("告警记录不存在"));
        alert.setIsHandled(true);
        alert.setHandler(handler);
        alert.setHandleMeasure(handleMeasure);
        alert.setHandleTime(LocalDateTime.now());
        return alertRecordRepository.save(alert);
    }

    public Map<String, Object> getAlertStatistics() {
        List<AlertRecord> allAlerts = alertRecordRepository.findAllOrderByAlertTimeDesc();
        long unhandledCount = allAlerts.stream().filter(a -> !a.getIsHandled()).count();
        long handledCount = allAlerts.size() - unhandledCount;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAlerts", allAlerts.size());
        stats.put("unhandledAlerts", unhandledCount);
        stats.put("handledAlerts", handledCount);
        stats.put("recentAlerts", getRecentAlerts());

        return stats;
    }
}