package com.company.watermonitor.service;

import com.company.watermonitor.entity.WaterMachine;
import com.company.watermonitor.entity.WaterRecord;
import com.company.watermonitor.repository.WaterRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final WaterRecordRepository recordRepository;
    private final WaterMachineService machineService;

    public List<Map<String, Object>> getConsumptionRates() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<WaterMachine> machines = machineService.getAllMachines();
        
        for (WaterMachine machine : machines) {
            Double rate = machineService.calculateConsumptionRate(machine.getMachineId());
            
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("machineId", machine.getMachineId());
            item.put("floor", machine.getFloor());
            item.put("location", machine.getLocation());
            item.put("consumptionRate", rate);
            result.add(item);
        }
        
        return result;
    }

    public List<Map<String, Object>> getMachineConsumptionHistory(Long machineId, int hours) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);
        
        List<WaterRecord> records = recordRepository.findByMachineIdAndReportTimeBetweenOrderByReportTime(
                machineId, startTime, endTime);
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (WaterRecord record : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("time", record.getReportTime());
            item.put("remainingLiters", record.getRemainingLiters());
            result.add(item);
        }
        
        return result;
    }

    public Map<String, Object> getConsumptionRateTrend(Long machineId, int hours) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);
        
        List<WaterRecord> records = recordRepository.findByMachineIdAndReportTimeBetweenOrderByReportTime(
                machineId, startTime, endTime);
        
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> labels = new ArrayList<>();
        List<Double> rates = new ArrayList<>();
        
        for (int i = 1; i < records.size(); i++) {
            WaterRecord prev = records.get(i - 1);
            WaterRecord curr = records.get(i);
            
            double waterConsumed = prev.getRemainingLiters() - curr.getRemainingLiters();
            if (waterConsumed < 0) {
                waterConsumed = 0;
            }
            
            double hoursBetween = java.time.Duration.between(
                    prev.getReportTime(), curr.getReportTime()).toMinutes() / 60.0;
            
            if (hoursBetween > 0) {
                labels.add(curr.getReportTime().toString());
                rates.add(waterConsumed / hoursBetween);
            }
        }
        
        result.put("labels", labels);
        result.put("rates", rates);
        return result;
    }
}
