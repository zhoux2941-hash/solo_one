package com.kindergarten.temperature.service;

import com.kindergarten.temperature.dto.TemperatureSnapshot;
import com.kindergarten.temperature.entity.Bed;
import com.kindergarten.temperature.entity.TemperatureRecord;
import com.kindergarten.temperature.repository.BedRepository;
import com.kindergarten.temperature.repository.TemperatureRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TemperatureDetectionService {

    @Value("${monitor.min-temperature:36.0}")
    private double minTemperature;

    @Value("${monitor.max-temperature:37.2}")
    private double maxTemperature;

    @Value("${monitor.max-rise:0.5}")
    private double maxRise;

    @Autowired
    private TemperatureRecordRepository recordRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private RedisSnapshotService snapshotService;

    public TemperatureRecord detectAndSave(Integer bedNo, double temperature) {
        LocalDateTime now = LocalDateTime.now();
        boolean abnormal = false;
        String abnormalType = null;
        String abnormalMessage = null;

        List<TemperatureRecord> lastRecords = recordRepository.findLatestByBedNo(
                bedNo, PageRequest.of(0, 2));

        if (temperature < minTemperature) {
            abnormal = true;
            abnormalType = "LOW_TEMPERATURE";
            abnormalMessage = String.format("体温过低：%.1f℃（正常范围 %.1f-%.1f℃）",
                    temperature, minTemperature, maxTemperature);
        } else if (temperature > maxTemperature) {
            abnormal = true;
            abnormalType = "HIGH_TEMPERATURE";
            abnormalMessage = String.format("体温过高：%.1f℃（正常范围 %.1f-%.1f℃）",
                    temperature, minTemperature, maxTemperature);
        }

        if (!abnormal && lastRecords.size() >= 2) {
            double lastTemp = lastRecords.get(0).getTemperature();
            double secondLastTemp = lastRecords.get(1).getTemperature();
            double rise1 = lastTemp - secondLastTemp;
            double rise2 = temperature - lastTemp;
            double totalRise = temperature - secondLastTemp;
            
            if (rise1 > 0 && rise2 > 0 && totalRise > maxRise) {
                abnormal = true;
                abnormalType = "RAPID_RISE";
                abnormalMessage = String.format("体温连续上升过快：%.1f℃ → %.1f℃ → %.1f℃，连续两次上升共 %.1f℃",
                        secondLastTemp, lastTemp, temperature, totalRise);
            }
        }

        TemperatureRecord record = new TemperatureRecord();
        record.setBedNo(bedNo);
        record.setTemperature(temperature);
        record.setRecordTime(now);
        record.setAbnormal(abnormal);
        record.setAbnormalType(abnormalType);
        record.setAbnormalMessage(abnormalMessage);

        TemperatureRecord saved = recordRepository.save(record);

        TemperatureSnapshot snapshot = buildSnapshot(bedNo, temperature, now, abnormal, abnormalType, abnormalMessage, lastRecords);
        snapshotService.saveSnapshot(snapshot);

        return saved;
    }

    private TemperatureSnapshot buildSnapshot(Integer bedNo, double temperature, LocalDateTime now,
                                               boolean abnormal, String abnormalType, String abnormalMessage,
                                               List<TemperatureRecord> lastRecords) {
        TemperatureSnapshot snapshot = new TemperatureSnapshot();
        snapshot.setBedNo(bedNo);
        snapshot.setCurrentTemperature(temperature);
        snapshot.setRecordTime(now);
        snapshot.setAbnormal(abnormal);
        snapshot.setAbnormalType(abnormalType);
        snapshot.setAbnormalMessage(abnormalMessage);

        Optional<Bed> bedOpt = bedRepository.findByBedNo(bedNo);
        bedOpt.ifPresent(bed -> snapshot.setChildName(bed.getChildName()));

        if (!lastRecords.isEmpty()) {
            snapshot.setLastTemperature(lastRecords.get(0).getTemperature());
        }

        return snapshot;
    }
}
