package com.metro.service;

import com.metro.entity.DustSensorData;
import com.metro.entity.TunnelSection;
import com.metro.entity.VentilationRecord;
import com.metro.entity.WarningRecord;
import com.metro.repository.DustSensorDataRepository;
import com.metro.repository.TunnelSectionRepository;
import com.metro.repository.VentilationRecordRepository;
import com.metro.repository.WarningRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DustWarningService {

    @Value("${dust.threshold.pm25:75}")
    private Double pm25Threshold;

    @Value("${dust.threshold.pm10:150}")
    private Double pm10Threshold;

    @Autowired
    private DustSensorDataRepository dustSensorDataRepository;

    @Autowired
    private TunnelSectionRepository tunnelSectionRepository;

    @Autowired
    private WarningRecordRepository warningRecordRepository;

    @Autowired
    private VentilationRecordRepository ventilationRecordRepository;

    @Transactional
    public Map<String, Object> reportDustData(String sectionId, Double pm25, Double pm10) {
        Map<String, Object> result = new HashMap<>();

        TunnelSection section = tunnelSectionRepository.findBySectionId(sectionId)
                .orElseThrow(() -> new RuntimeException("隧道区间不存在: " + sectionId));

        DustSensorData sensorData = new DustSensorData();
        sensorData.setSectionId(sectionId);
        sensorData.setPm25(pm25);
        sensorData.setPm10(pm10);
        sensorData.setReportTime(LocalDateTime.now());

        boolean warningTriggered = false;
        List<String> warningTypes = new ArrayList<>();

        if (pm25 > pm25Threshold) {
            warningTriggered = true;
            warningTypes.add("PM2.5超标");
        }
        if (pm10 > pm10Threshold) {
            warningTriggered = true;
            warningTypes.add("PM10超标");
        }

        sensorData.setWarningTriggered(warningTriggered);
        dustSensorDataRepository.save(sensorData);

        result.put("sensorData", sensorData);
        result.put("warningTriggered", warningTriggered);

        if (warningTriggered) {
            String warningType = String.join(",", warningTypes);
            
            List<WarningRecord> existingWarnings = warningRecordRepository
                    .findActiveWarningsBySectionIdAndType(sectionId, warningType);

            if (existingWarnings.isEmpty()) {
                WarningRecord warning = new WarningRecord();
                warning.setSectionId(sectionId);
                warning.setSectionName(section.getSectionName());
                warning.setPm25(pm25);
                warning.setPm10(pm10);
                warning.setWarningType(warningType);
                warning.setWarningTime(LocalDateTime.now());
                warning.setResolved(false);
                warningRecordRepository.save(warning);
                result.put("warningRecord", warning);
                result.put("isNewWarning", true);

                if (!section.getVentilationActive()) {
                    startVentilation(sectionId, section.getSectionName(), pm25, pm10, warningType);
                    result.put("ventilationStarted", true);
                } else {
                    result.put("ventilationAlreadyActive", true);
                }
            } else {
                WarningRecord existingWarning = existingWarnings.get(0);
                existingWarning.setPm25(pm25);
                existingWarning.setPm10(pm10);
                warningRecordRepository.save(existingWarning);
                result.put("warningRecord", existingWarning);
                result.put("isNewWarning", false);
                result.put("warningMessage", "已有相同类型的未处理告警，已更新浓度数据");
            }
        }

        return result;
    }

    @Transactional
    public VentilationRecord startVentilation(String sectionId, String sectionName,
                                              Double startPm25, Double startPm10, String reason) {
        TunnelSection section = tunnelSectionRepository.findBySectionId(sectionId)
                .orElseThrow(() -> new RuntimeException("隧道区间不存在: " + sectionId));

        if (section.getVentilationActive()) {
            return null;
        }

        VentilationRecord record = new VentilationRecord();
        record.setSectionId(sectionId);
        record.setSectionName(sectionName);
        record.setStartTime(LocalDateTime.now());
        record.setTriggerReason(reason);
        record.setStartPm25(startPm25);
        record.setStartPm10(startPm10);
        ventilationRecordRepository.save(record);

        section.setVentilationActive(true);
        section.setVentilationStartTime(LocalDateTime.now());
        tunnelSectionRepository.save(section);

        return record;
    }

    @Transactional
    public VentilationRecord stopVentilation(String sectionId) {
        TunnelSection section = tunnelSectionRepository.findBySectionId(sectionId)
                .orElseThrow(() -> new RuntimeException("隧道区间不存在: " + sectionId));

        if (!section.getVentilationActive()) {
            return null;
        }

        VentilationRecord record = ventilationRecordRepository
                .findBySectionIdOrderByStartTimeDesc(sectionId)
                .stream()
                .filter(r -> r.getEndTime() == null)
                .findFirst()
                .orElse(null);

        if (record == null) {
            return null;
        }

        LocalDateTime endTime = LocalDateTime.now();
        long duration = ChronoUnit.SECONDS.between(record.getStartTime(), endTime);

        record.setEndTime(endTime);
        record.setDurationSeconds(duration);

        DustSensorData latestData = dustSensorDataRepository
                .findBySectionIdOrderByReportTimeDesc(sectionId)
                .stream()
                .findFirst()
                .orElse(null);

        if (latestData != null) {
            record.setEndPm25(latestData.getPm25());
            record.setEndPm10(latestData.getPm10());

            double pm25Reduction = record.getStartPm25() - latestData.getPm25();
            double pm10Reduction = record.getStartPm10() - latestData.getPm10();
            record.setEffectRemark(String.format("PM2.5降低%.1fμg/m³, PM10降低%.1fμg/m³", pm25Reduction, pm10Reduction));
        }

        ventilationRecordRepository.save(record);

        section.setVentilationActive(false);
        section.setVentilationStartTime(null);
        section.setTotalVentilationDuration(section.getTotalVentilationDuration() + duration);
        tunnelSectionRepository.save(section);

        List<WarningRecord> warnings = warningRecordRepository.findBySectionIdOrderByWarningTimeDesc(sectionId);
        for (WarningRecord warning : warnings) {
            if (!warning.getResolved()) {
                warning.setResolved(true);
                warning.setResolveTime(endTime);
                warning.setResolveRemark("通风结束，粉尘浓度已监测");
                warningRecordRepository.save(warning);
            }
        }

        return record;
    }

    public List<DustSensorData> getLatestDustData(int limit) {
        return dustSensorDataRepository.findTop10ByOrderByReportTimeDesc();
    }

    public List<DustSensorData> getDustDataBySection(String sectionId) {
        return dustSensorDataRepository.findBySectionIdOrderByReportTimeDesc(sectionId);
    }

    public List<WarningRecord> getActiveWarnings() {
        return warningRecordRepository.findByResolvedOrderByWarningTimeDesc(false);
    }

    public List<WarningRecord> getAllWarnings() {
        return warningRecordRepository.findTop10ByOrderByWarningTimeDesc();
    }

    public List<TunnelSection> getAllTunnelSections() {
        return tunnelSectionRepository.findAll();
    }
}
