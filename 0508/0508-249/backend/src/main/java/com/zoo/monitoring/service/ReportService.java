package com.zoo.monitoring.service;

import com.zoo.monitoring.repository.AlertRepository;
import com.zoo.monitoring.repository.BirdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {
    @Autowired
    private BirdRepository birdRepository;

    @Autowired
    private AlertRepository alertRepository;

    public List<Map<String, Object>> getVaccinationRateReport() {
        List<Map<String, Object>> report = new ArrayList<>();
        List<String> speciesList = birdRepository.findAllDistinctSpecies();

        for (String species : speciesList) {
            Long total = birdRepository.countBySpecies(species);
            Long vaccinated = birdRepository.countVaccinatedBySpecies(species);
            double rate = total > 0 ? (vaccinated * 100.0 / total) : 0;

            Map<String, Object> item = new HashMap<>();
            item.put("species", species);
            item.put("total", total);
            item.put("vaccinated", vaccinated);
            item.put("rate", String.format("%.2f", rate));
            report.add(item);
        }
        return report;
    }

    public Map<String, Object> getAlertStatistics(int days) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(days);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAlerts", alertRepository.countByTimeRange(start, end));
        stats.put("level1Alerts", alertRepository.countByAlertLevelAndTimeRange("一级预警", start, end));
        stats.put("level2Alerts", alertRepository.countByAlertLevelAndTimeRange("二级预警", start, end));

        List<Object[]> typeCounts = alertRepository.countByAlertType(start, end);
        Map<String, Long> alertTypeStats = new HashMap<>();
        for (Object[] row : typeCounts) {
            alertTypeStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("alertTypes", alertTypeStats);
        stats.put("periodDays", days);

        return stats;
    }
}
