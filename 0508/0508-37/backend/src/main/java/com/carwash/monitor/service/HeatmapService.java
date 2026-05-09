package com.carwash.monitor.service;

import com.carwash.monitor.config.FoamConfig;
import com.carwash.monitor.dto.HeatmapDataDTO;
import com.carwash.monitor.entity.FoamConcentration;
import com.carwash.monitor.repository.FoamConcentrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HeatmapService {

    private final FoamConcentrationRepository repository;
    private final FoamConfig foamConfig;

    private static final List<String> MACHINES = Arrays.asList("C1", "C2", "C3", "C4");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final int DEVIATION_NORMAL = 0;
    private static final int DEVIATION_MILD = 1;
    private static final int DEVIATION_SEVERE = 2;

    public static final String CACHE_NAME = "heatmap";

    @Cacheable(value = CACHE_NAME, key = "'last24Hours'")
    public HeatmapDataDTO getLast24HoursHeatmap() {
        log.info("Generating heatmap data from database (not from cache)");

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(24);

        List<FoamConcentration> records = repository.findByConditions(null, startTime, endTime);

        Map<String, Map<Integer, FoamConcentration>> machineHourMap = buildMachineHourMap(records);

        List<String> hours = buildHourLabels(startTime);
        List<HeatmapDataDTO.HeatmapCell> cells = new ArrayList<>();

        for (int machineIdx = 0; machineIdx < MACHINES.size(); machineIdx++) {
            String machineId = MACHINES.get(machineIdx);
            Map<Integer, FoamConcentration> hourMap = machineHourMap.getOrDefault(machineId, Collections.emptyMap());

            for (int hourSlot = 0; hourSlot < 24; hourSlot++) {
                FoamConcentration record = hourMap.get(hourSlot);
                double concentration = record != null ? record.getConcentration() : -1.0;

                HeatmapDataDTO.HeatmapCell cell = createCell(hourSlot, machineIdx, machineId, concentration);
                cells.add(cell);
            }
        }

        return HeatmapDataDTO.builder()
                .hours(hours)
                .machines(new ArrayList<>(MACHINES))
                .data(cells)
                .cacheTime(LocalDateTime.now().format(FORMATTER))
                .build();
    }

    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void evictCache() {
        log.info("Evicted heatmap cache");
    }

    private Map<String, Map<Integer, FoamConcentration>> buildMachineHourMap(List<FoamConcentration> records) {
        Map<String, Map<Integer, FoamConcentration>> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (FoamConcentration record : records) {
            String machineId = record.getMachineId();
            int hourSlot = calculateHourSlot(record.getRecordTime(), now);

            if (hourSlot >= 0 && hourSlot < 24) {
                result.computeIfAbsent(machineId, k -> new HashMap<>())
                      .put(hourSlot, record);
            }
        }
        return result;
    }

    private int calculateHourSlot(LocalDateTime recordTime, LocalDateTime now) {
        LocalDateTime startTime = now.minusHours(24);
        long hoursDiff = java.time.Duration.between(startTime, recordTime).toHours();
        return (int) hoursDiff;
    }

    private List<String> buildHourLabels(LocalDateTime startTime) {
        List<String> labels = new ArrayList<>();
        LocalDateTime current = startTime;
        for (int i = 0; i < 24; i++) {
            labels.add(String.format("%02d:00", current.getHour()));
            current = current.plusHours(1);
        }
        return labels;
    }

    private HeatmapDataDTO.HeatmapCell createCell(int hourSlot, int machineIdx, String machineId, double concentration) {
        if (concentration < 0) {
            return HeatmapDataDTO.HeatmapCell.builder()
                    .hour(hourSlot)
                    .machineIndex(machineIdx)
                    .machineId(machineId)
                    .concentration(-1)
                    .deviationLevel(DEVIATION_NORMAL)
                    .status("normal")
                    .build();
        }

        int deviationLevel;
        String status;

        double minNormal = foamConfig.getMinNormal();
        double maxNormal = foamConfig.getMaxNormal();
        double normalRange = maxNormal - minNormal;

        if (concentration >= minNormal && concentration <= maxNormal) {
            deviationLevel = DEVIATION_NORMAL;
            status = "normal";
        } else {
            double deviation;
            if (concentration < minNormal) {
                deviation = minNormal - concentration;
            } else {
                deviation = concentration - maxNormal;
            }

            double deviationRatio = deviation / normalRange;

            if (deviationRatio < 0.5) {
                deviationLevel = DEVIATION_MILD;
                status = "mild";
            } else {
                deviationLevel = DEVIATION_SEVERE;
                status = "severe";
            }
        }

        return HeatmapDataDTO.HeatmapCell.builder()
                .hour(hourSlot)
                .machineIndex(machineIdx)
                .machineId(machineId)
                .concentration(Math.round(concentration * 100.0) / 100.0)
                .deviationLevel(deviationLevel)
                .status(status)
                .build();
    }
}
