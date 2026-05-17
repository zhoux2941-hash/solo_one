package com.prison.call.service;

import com.prison.call.entity.Alert;
import com.prison.call.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlertService {
    
    @Autowired
    private AlertRepository alertRepository;
    
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }
    
    public List<Alert> getPendingAlerts() {
        return alertRepository.findByStatus("PENDING");
    }
    
    public List<Alert> getAlertsByPrisonArea(String prisonArea) {
        return alertRepository.findByPrisonArea(prisonArea);
    }
    
    public Optional<Alert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }
    
    public Alert handleAlert(Long id, String handler) {
        Optional<Alert> alertOpt = alertRepository.findById(id);
        if (alertOpt.isEmpty()) {
            throw new RuntimeException("预警不存在");
        }
        
        Alert alert = alertOpt.get();
        alert.setStatus("HANDLED");
        alert.setHandler(handler);
        alert.setHandledAt(java.time.LocalDateTime.now());
        
        return alertRepository.save(alert);
    }
}
