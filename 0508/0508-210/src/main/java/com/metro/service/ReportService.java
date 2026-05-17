package com.metro.service;

import com.metro.entity.DustSensorData;
import com.metro.entity.TunnelSection;
import com.metro.entity.VentilationRecord;
import com.metro.repository.DustSensorDataRepository;
import com.metro.repository.TunnelSectionRepository;
import com.metro.repository.VentilationRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportService {

    @Autowired
    private DustSensorDataRepository dustSensorDataRepository;

    @Autowired
    private VentilationRecordRepository ventilationRecordRepository;

    @Autowired
    private TunnelSectionRepository tunnelSectionRepository;

    public Map<String, Object> getDustConcentrationTrend(String sectionId, LocalDateTime startTime, LocalDateTime endTime) {
        Map<String, Object> result = new HashMap<>();

        List<DustSensorData> dataList;
        if (sectionId != null && !sectionId.isEmpty()) {
            dataList = dustSensorDataRepository.findBySectionIdAndTimeRange(sectionId, startTime, endTime);
        } else {
            dataList = dustSensorDataRepository.findByTimeRange(startTime, endTime);
        }

        Map<String, List<Map<String, Object>>> trendData = new HashMap<>();

        for (DustSensorData data : dataList) {
            String key = data.getSectionId();
            if (!trendData.containsKey(key)) {
                trendData.put(key, new ArrayList<>());
            }

            Map<String, Object> point = new HashMap<>();
            point.put("time", data.getReportTime().toString());
            point.put("pm25", data.getPm25());
            point.put("pm10", data.getPm10());
            trendData.get(key).add(point);
        }

        result.put("trendData", trendData);
        result.put("startTime", startTime.toString());
        result.put("endTime", endTime.toString());

        return result;
    }

    public Map<String, Object> getVentilationDurationReport(LocalDateTime startTime, LocalDateTime endTime) {
        Map<String, Object> result = new HashMap<>();

        List<TunnelSection> sections = tunnelSectionRepository.findAll();
        List<Map<String, Object>> durationList = new ArrayList<>();

        List<Object[]> summedData = ventilationRecordRepository.sumDurationGroupBySectionIdAndTimeRange(startTime, endTime);
        Map<String, Long> durationMap = new HashMap<>();
        for (Object[] row : summedData) {
            durationMap.put((String) row[0], (Long) row[1]);
        }

        for (TunnelSection section : sections) {
            Map<String, Object> item = new HashMap<>();
            item.put("sectionId", section.getSectionId());
            item.put("sectionName", section.getSectionName());

            Long duration = durationMap.getOrDefault(section.getSectionId(), 0L);

            if (section.getVentilationActive() && section.getVentilationStartTime() != null) {
                long currentDuration = java.time.temporal.ChronoUnit.SECONDS.between(section.getVentilationStartTime(), LocalDateTime.now());
                duration += currentDuration;
                item.put("currentlyRunning", true);
                item.put("currentDuration", currentDuration);
            } else {
                item.put("currentlyRunning", false);
            }

            item.put("totalDurationSeconds", duration);
            item.put("totalDurationMinutes", Math.round(duration / 60.0 * 10) / 10.0);
            item.put("totalDurationHours", Math.round(duration / 3600.0 * 100) / 100.0);
            durationList.add(item);
        }

        durationList.sort((a, b) -> Long.compare(
                ((Number) b.get("totalDurationSeconds")).longValue(),
                ((Number) a.get("totalDurationSeconds")).longValue()
        ));

        result.put("durationList", durationList);
        result.put("startTime", startTime.toString());
        result.put("endTime", endTime.toString());

        return result;
    }

    public Map<String, Object> getDashboardData() {
        Map<String, Object> result = new HashMap<>();

        List<TunnelSection> sections = tunnelSectionRepository.findAll();
        int activeVentilationCount = 0;
        for (TunnelSection section : sections) {
            if (section.getVentilationActive()) {
                activeVentilationCount++;
            }
        }

        long activeWarningCount = sections.stream()
                .filter(s -> s.getVentilationActive())
                .count();

        List<DustSensorData> latestData = dustSensorDataRepository.findTop10ByOrderByReportTimeDesc();

        result.put("totalSections", sections.size());
        result.put("activeVentilationCount", activeVentilationCount);
        result.put("activeWarningCount", activeWarningCount);
        result.put("latestSensorData", latestData);

        return result;
    }

    public List<VentilationRecord> getVentilationRecords(String sectionId) {
        if (sectionId != null && !sectionId.isEmpty()) {
            return ventilationRecordRepository.findBySectionIdOrderByStartTimeDesc(sectionId);
        }
        return ventilationRecordRepository.findAll();
    }
}
