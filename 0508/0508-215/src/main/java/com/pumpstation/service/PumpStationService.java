package com.pumpstation.service;

import com.pumpstation.entity.OperationRecord;
import com.pumpstation.entity.PumpStation;
import com.pumpstation.entity.WaterLevelRecord;
import com.pumpstation.repository.OperationRecordRepository;
import com.pumpstation.repository.PumpStationRepository;
import com.pumpstation.repository.WaterLevelRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PumpStationService {
    
    private static final double DRAINAGE_RATE_PER_MINUTE = 5.0;
    
    @Autowired
    private PumpStationRepository pumpStationRepository;
    
    @Autowired
    private WaterLevelRecordRepository waterLevelRecordRepository;
    
    @Autowired
    private OperationRecordRepository operationRecordRepository;
    
    public List<PumpStation> getAllPumpStations() {
        List<PumpStation> stations = pumpStationRepository.findAll();
        for (PumpStation station : stations) {
            Long count = operationRecordRepository.countOperationByPumpNo(station.getPumpNo());
            station.setOperationCount(count != null ? count : 0L);
        }
        return stations;
    }
    
    public Optional<PumpStation> getPumpStationByPumpNo(String pumpNo) {
        return pumpStationRepository.findByPumpNo(pumpNo).map(station -> {
            Long count = operationRecordRepository.countOperationByPumpNo(pumpNo);
            station.setOperationCount(count != null ? count : 0L);
            return station;
        });
    }
    
    @Transactional
    public PumpStation createPumpStation(PumpStation pumpStation) {
        if (pumpStationRepository.existsByPumpNo(pumpStation.getPumpNo())) {
            throw new RuntimeException("泵站编号已存在: " + pumpStation.getPumpNo());
        }
        return pumpStationRepository.save(pumpStation);
    }
    
    @Transactional
    public PumpStation updatePumpStation(String pumpNo, PumpStation pumpStation) {
        PumpStation existing = pumpStationRepository.findByPumpNo(pumpNo)
            .orElseThrow(() -> new RuntimeException("泵站不存在: " + pumpNo));
        
        existing.setPower(pumpStation.getPower());
        existing.setStartWaterLevel(pumpStation.getStartWaterLevel());
        existing.setStopWaterLevel(pumpStation.getStopWaterLevel());
        
        return pumpStationRepository.save(existing);
    }
    
    @Transactional
    public WaterLevelRecord reportWaterLevel(String pumpNo, Double waterLevel) {
        PumpStation pumpStation = pumpStationRepository.findByPumpNo(pumpNo)
            .orElseThrow(() -> new RuntimeException("泵站不存在: " + pumpNo));
        
        WaterLevelRecord record = new WaterLevelRecord();
        record.setPumpNo(pumpNo);
        record.setWaterLevel(waterLevel);
        record.setRecordTime(LocalDateTime.now());
        waterLevelRecordRepository.save(record);
        
        pumpStation.setCurrentWaterLevel(waterLevel);
        pumpStationRepository.save(pumpStation);
        
        checkAndControlPump(pumpStation, waterLevel);
        
        return record;
    }
    
    @Transactional
    protected void checkAndControlPump(PumpStation pumpStation, Double currentWaterLevel) {
        if (currentWaterLevel >= pumpStation.getStartWaterLevel() && !pumpStation.getIsRunning()) {
            startPump(pumpStation, currentWaterLevel);
        } else if (currentWaterLevel <= pumpStation.getStopWaterLevel() && pumpStation.getIsRunning()) {
            stopPump(pumpStation, currentWaterLevel);
        }
    }
    
    @Transactional
    public void startPump(PumpStation pumpStation, Double waterLevel) {
        pumpStation.setIsRunning(true);
        pumpStation.setLastStartTime(LocalDateTime.now());
        pumpStationRepository.save(pumpStation);
        
        OperationRecord record = new OperationRecord();
        record.setPumpNo(pumpStation.getPumpNo());
        record.setOperationType("START");
        record.setStartTime(LocalDateTime.now());
        record.setStartWaterLevel(waterLevel);
        operationRecordRepository.save(record);
    }
    
    @Transactional
    public void stopPump(PumpStation pumpStation, Double waterLevel) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = pumpStation.getLastStartTime();
        
        long runningMinutes = 0;
        if (startTime != null) {
            runningMinutes = Duration.between(startTime, endTime).toMinutes();
            if (runningMinutes < 0) runningMinutes = 0;
        }
        
        double drainageAmount = runningMinutes * DRAINAGE_RATE_PER_MINUTE;
        double energyConsumption = runningMinutes * pumpStation.getPower() / 60.0;
        double efficiency = pumpStation.getPower() > 0 ? drainageAmount / energyConsumption : 0;
        
        pumpStation.setIsRunning(false);
        pumpStation.setLastStopTime(endTime);
        pumpStation.setTotalDrainage(pumpStation.getTotalDrainage() + drainageAmount);
        pumpStation.setTotalEnergyConsumption(pumpStation.getTotalEnergyConsumption() + energyConsumption);
        pumpStationRepository.save(pumpStation);
        
        OperationRecord record = operationRecordRepository
            .findTopByPumpNoAndOperationTypeOrderByStartTimeDesc(pumpStation.getPumpNo(), "START")
            .orElse(null);
        
        if (record == null) {
            record = new OperationRecord();
            record.setPumpNo(pumpStation.getPumpNo());
            record.setStartTime(startTime != null ? startTime : endTime);
            record.setStartWaterLevel(pumpStation.getCurrentWaterLevel());
        }
        
        record.setOperationType("COMPLETE");
        record.setEndTime(endTime);
        record.setRunningDuration(runningMinutes);
        record.setDrainageAmount(drainageAmount);
        record.setEnergyConsumption(energyConsumption);
        record.setEndWaterLevel(waterLevel);
        record.setPumpEfficiency(efficiency);
        operationRecordRepository.save(record);
    }
    
    public List<WaterLevelRecord> getWaterLevelHistory(String pumpNo) {
        return waterLevelRecordRepository.findByPumpNoOrderByRecordTimeDesc(pumpNo);
    }
    
    public List<OperationRecord> getOperationHistory(String pumpNo) {
        return operationRecordRepository.findByPumpNoOrderByStartTimeDesc(pumpNo);
    }
    
    @Transactional
    public void manualStartPump(String pumpNo) {
        PumpStation pumpStation = pumpStationRepository.findByPumpNo(pumpNo)
            .orElseThrow(() -> new RuntimeException("泵站不存在: " + pumpNo));
        
        if (!pumpStation.getIsRunning()) {
            startPump(pumpStation, pumpStation.getCurrentWaterLevel());
        }
    }
    
    @Transactional
    public void manualStopPump(String pumpNo) {
        PumpStation pumpStation = pumpStationRepository.findByPumpNo(pumpNo)
            .orElseThrow(() -> new RuntimeException("泵站不存在: " + pumpNo));
        
        if (pumpStation.getIsRunning()) {
            stopPump(pumpStation, pumpStation.getCurrentWaterLevel());
        }
    }
}
