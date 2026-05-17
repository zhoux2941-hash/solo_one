package com.oceanheritage.controller;

import com.oceanheritage.dto.AlertDTO;
import com.oceanheritage.entity.Alert;
import com.oceanheritage.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private AlertRepository alertRepository;

    private AlertDTO convertToDTO(Alert alert) {
        AlertDTO dto = new AlertDTO();
        dto.setId(alert.getId());
        dto.setShipMmsi(alert.getShipMmsi());
        dto.setShipName(alert.getShipName());
        dto.setAreaId(alert.getAreaId());
        dto.setAreaName(alert.getAreaName());
        dto.setLng(alert.getLng());
        dto.setLat(alert.getLat());
        dto.setSpeed(alert.getSpeed());
        dto.setAlertTime(alert.getAlertTime());
        dto.setEvidence(alert.getEvidence());
        dto.setType(alert.getType() != null ? alert.getType().name() : null);
        dto.setStatus(alert.getStatus() != null ? alert.getStatus().name() : null);
        return dto;
    }

    @GetMapping("/violations")
    public List<AlertDTO> getViolations() {
        List<Alert> alerts = alertRepository.findAll();
        List<AlertDTO> dtos = new ArrayList<>();
        for (Alert alert : alerts) {
            dtos.add(convertToDTO(alert));
        }
        return dtos;
    }

    @GetMapping("/ship-statistics")
    public List<Map<String, Object>> getShipStatistics() {
        List<Object[]> results = alertRepository.countByShipMmsi();
        List<Map<String, Object>> statistics = new ArrayList<>();
        
        for (Object[] result : results) {
            Map<String, Object> stat = new HashMap<>();
            stat.put("mmsi", result[0]);
            stat.put("violationCount", result[1]);
            statistics.add(stat);
        }
        
        return statistics;
    }

    @GetMapping("/heatmap")
    public List<Map<String, Object>> getHeatmapData() {
        List<Object[]> results = alertRepository.getHeatmapData();
        List<Map<String, Object>> heatmapData = new ArrayList<>();
        
        for (Object[] result : results) {
            Map<String, Object> point = new HashMap<>();
            point.put("lng", result[0]);
            point.put("lat", result[1]);
            point.put("count", result[2]);
            heatmapData.add(point);
        }
        
        return heatmapData;
    }

    @GetMapping("/alerts")
    public List<AlertDTO> getActiveAlerts() {
        List<Alert> alerts = alertRepository.findByStatus(Alert.AlertStatus.ACTIVE);
        List<AlertDTO> dtos = new ArrayList<>();
        for (Alert alert : alerts) {
            dtos.add(convertToDTO(alert));
        }
        return dtos;
    }

    @PutMapping("/alerts/{id}/acknowledge")
    public AlertDTO acknowledgeAlert(@PathVariable Long id) {
        Alert alert = alertRepository.findById(id).orElse(null);
        if (alert != null) {
            alert.setStatus(Alert.AlertStatus.ACKNOWLEDGED);
            alert = alertRepository.save(alert);
            return convertToDTO(alert);
        }
        return null;
    }
}
