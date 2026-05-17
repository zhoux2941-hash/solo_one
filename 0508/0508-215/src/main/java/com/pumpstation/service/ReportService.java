package com.pumpstation.service;

import com.pumpstation.entity.OperationRecord;
import com.pumpstation.entity.PumpStation;
import com.pumpstation.repository.OperationRecordRepository;
import com.pumpstation.repository.PumpStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {
    
    @Autowired
    private OperationRecordRepository operationRecordRepository;
    
    @Autowired
    private PumpStationRepository pumpStationRepository;
    
    public Map<String, Object> getMonthlyReport(String pumpNo, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startTime = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endTime = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        
        Map<String, Object> report = new HashMap<>();
        report.put("pumpNo", pumpNo);
        report.put("year", year);
        report.put("month", month);
        
        Double totalDrainage = operationRecordRepository
            .sumDrainageAmountByPumpNoAndTimeRange(pumpNo, startTime, endTime);
        report.put("totalDrainage", totalDrainage != null ? totalDrainage : 0.0);
        
        Double totalEnergy = operationRecordRepository
            .sumEnergyConsumptionByPumpNoAndTimeRange(pumpNo, startTime, endTime);
        report.put("totalEnergyConsumption", totalEnergy != null ? totalEnergy : 0.0);
        
        Long totalDuration = operationRecordRepository
            .sumRunningDurationByPumpNoAndTimeRange(pumpNo, startTime, endTime);
        report.put("totalRunningMinutes", totalDuration != null ? totalDuration : 0L);
        
        double avgEfficiency = 0.0;
        if (totalEnergy != null && totalEnergy > 0 && totalDrainage != null) {
            avgEfficiency = totalDrainage / totalEnergy;
        }
        report.put("averageEfficiency", avgEfficiency);
        
        List<OperationRecord> records = operationRecordRepository
            .findByPumpNoAndStartTimeBetweenOrderByStartTimeAsc(pumpNo, startTime, endTime);
        report.put("operationCount", records.size());
        
        return report;
    }
    
    public List<Map<String, Object>> getEfficiencyTrend(String pumpNo, int months) {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = months - 1; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.from(now.minusMonths(i));
            LocalDateTime startTime = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime endTime = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("year", yearMonth.getYear());
            monthData.put("month", yearMonth.getMonthValue());
            
            Double totalDrainage = operationRecordRepository
                .sumDrainageAmountByPumpNoAndTimeRange(pumpNo, startTime, endTime);
            Double totalEnergy = operationRecordRepository
                .sumEnergyConsumptionByPumpNoAndTimeRange(pumpNo, startTime, endTime);
            
            double efficiency = 0.0;
            if (totalEnergy != null && totalEnergy > 0 && totalDrainage != null) {
                efficiency = totalDrainage / totalEnergy;
            }
            
            monthData.put("efficiency", efficiency);
            monthData.put("drainage", totalDrainage != null ? totalDrainage : 0.0);
            monthData.put("energy", totalEnergy != null ? totalEnergy : 0.0);
            
            trend.add(monthData);
        }
        
        return trend;
    }
    
    public Map<String, Object> getAllPumpsMonthlyReport(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startTime = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endTime = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        
        Map<String, Object> report = new HashMap<>();
        report.put("year", year);
        report.put("month", month);
        
        List<Map<String, Object>> pumpReports = new ArrayList<>();
        List<PumpStation> allPumps = pumpStationRepository.findAll();
        
        double totalDrainageAll = 0.0;
        double totalEnergyAll = 0.0;
        
        for (PumpStation pump : allPumps) {
            Map<String, Object> pumpReport = new HashMap<>();
            pumpReport.put("pumpNo", pump.getPumpNo());
            pumpReport.put("power", pump.getPower());
            
            Double drainage = operationRecordRepository
                .sumDrainageAmountByPumpNoAndTimeRange(pump.getPumpNo(), startTime, endTime);
            Double energy = operationRecordRepository
                .sumEnergyConsumptionByPumpNoAndTimeRange(pump.getPumpNo(), startTime, endTime);
            
            drainage = drainage != null ? drainage : 0.0;
            energy = energy != null ? energy : 0.0;
            
            pumpReport.put("drainage", drainage);
            pumpReport.put("energyConsumption", energy);
            
            double efficiency = energy > 0 ? drainage / energy : 0.0;
            pumpReport.put("efficiency", efficiency);
            
            pumpReports.add(pumpReport);
            
            totalDrainageAll += drainage;
            totalEnergyAll += energy;
        }
        
        report.put("pumps", pumpReports);
        report.put("totalDrainage", totalDrainageAll);
        report.put("totalEnergyConsumption", totalEnergyAll);
        report.put("overallEfficiency", totalEnergyAll > 0 ? totalDrainageAll / totalEnergyAll : 0.0);
        
        return report;
    }
}
