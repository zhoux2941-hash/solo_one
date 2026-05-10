package com.company.watermonitor.service;

import com.company.watermonitor.dto.MachineStatusDTO;
import com.company.watermonitor.entity.WaterMachine;
import com.company.watermonitor.entity.WaterRecord;
import com.company.watermonitor.repository.WaterMachineRepository;
import com.company.watermonitor.repository.WaterRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class WaterMachineService {

    private final WaterMachineRepository machineRepository;
    private final WaterRecordRepository recordRepository;
    private final DeliveryOrderService deliveryOrderService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.low-water-threshold:5}")
    private Double lowWaterThreshold;

    @Value("${app.max-water-capacity:20}")
    private Double maxWaterCapacity;

    private static final String MACHINE_STATUS_KEY = "machine:status:";

    public List<WaterMachine> getAllMachines() {
        return machineRepository.findAll();
    }

    public WaterMachine getMachineById(Long machineId) {
        return machineRepository.findById(machineId).orElse(null);
    }

    public WaterMachine saveMachine(WaterMachine machine) {
        return machineRepository.save(machine);
    }

    @Scheduled(fixedRate = 1800000)
    public void simulateSensorReport() {
        List<WaterMachine> machines = machineRepository.findAll();
        Map<Long, Double> lowWaterMachines = new LinkedHashMap<>();
        
        for (WaterMachine machine : machines) {
            Double remainingWater = simulateWaterReport(machine);
            if (remainingWater != null && remainingWater < lowWaterThreshold) {
                lowWaterMachines.put(machine.getMachineId(), remainingWater);
            }
        }
        
        if (!lowWaterMachines.isEmpty()) {
            deliveryOrderService.createBatchOrders(lowWaterMachines);
        }
    }

    public Double simulateWaterReport(WaterMachine machine) {
        MachineStatusDTO currentStatus = getMachineStatusFromCache(machine.getMachineId());
        Double currentWater = maxWaterCapacity;
        LocalDateTime lastReportTime = LocalDateTime.now();
        
        if (currentStatus != null && currentStatus.getRemainingLiters() != null) {
            currentWater = currentStatus.getRemainingLiters();
        }

        Double consumption = ThreadLocalRandom.current().nextDouble(0.5, 2.5);
        currentWater = Math.max(0, currentWater - consumption);

        WaterRecord record = new WaterRecord();
        record.setMachineId(machine.getMachineId());
        record.setRemainingLiters(currentWater);
        record.setReportTime(lastReportTime);
        recordRepository.save(record);

        boolean isLowWater = currentWater < lowWaterThreshold;
        
        MachineStatusDTO statusDTO = new MachineStatusDTO();
        statusDTO.setMachineId(machine.getMachineId());
        statusDTO.setFloor(machine.getFloor());
        statusDTO.setLocation(machine.getLocation());
        statusDTO.setRemainingLiters(currentWater);
        statusDTO.setMaxCapacity(maxWaterCapacity);
        statusDTO.setIsLowWater(isLowWater);
        statusDTO.setLastReportTime(lastReportTime);
        
        Double consumptionRate = calculateConsumptionRate(machine.getMachineId());
        statusDTO.setConsumptionRate(consumptionRate);
        statusDTO.setEstimatedLowWaterTime(predictLowWaterTime(currentWater, consumptionRate));

        updateMachineStatusCache(statusDTO);

        return currentWater;
    }

    public MachineStatusDTO getMachineStatusFromCache(Long machineId) {
        return (MachineStatusDTO) redisTemplate.opsForValue().get(MACHINE_STATUS_KEY + machineId);
    }

    public void updateMachineStatusCache(MachineStatusDTO statusDTO) {
        redisTemplate.opsForValue().set(MACHINE_STATUS_KEY + statusDTO.getMachineId(), statusDTO);
    }

    public List<MachineStatusDTO> getAllMachineStatuses() {
        List<MachineStatusDTO> statuses = new ArrayList<>();
        List<WaterMachine> machines = machineRepository.findAll();
        
        for (WaterMachine machine : machines) {
            MachineStatusDTO status = getMachineStatusFromCache(machine.getMachineId());
            if (status == null) {
                status = initializeMachineStatus(machine);
            }
            statuses.add(status);
        }
        
        statuses.sort(Comparator.comparing(MachineStatusDTO::getFloor));
        return statuses;
    }

    private MachineStatusDTO initializeMachineStatus(WaterMachine machine) {
        List<WaterRecord> records = recordRepository.findLast2RecordsByMachineId(machine.getMachineId());
        
        MachineStatusDTO status = new MachineStatusDTO();
        status.setMachineId(machine.getMachineId());
        status.setFloor(machine.getFloor());
        status.setLocation(machine.getLocation());
        status.setMaxCapacity(maxWaterCapacity);
        
        if (!records.isEmpty()) {
            WaterRecord latest = records.get(0);
            status.setRemainingLiters(latest.getRemainingLiters());
            status.setLastReportTime(latest.getReportTime());
            status.setIsLowWater(latest.getRemainingLiters() < lowWaterThreshold);
        } else {
            status.setRemainingLiters(maxWaterCapacity);
            status.setLastReportTime(LocalDateTime.now());
            status.setIsLowWater(false);
        }
        
        Double rate = calculateConsumptionRate(machine.getMachineId());
        status.setConsumptionRate(rate);
        status.setEstimatedLowWaterTime(predictLowWaterTime(status.getRemainingLiters(), rate));
        
        updateMachineStatusCache(status);
        return status;
    }

    public Double calculateConsumptionRate(Long machineId) {
        List<WaterRecord> records = recordRepository.findLast2RecordsByMachineId(machineId);
        if (records.size() < 2) {
            return 2.0;
        }
        
        WaterRecord latest = records.get(0);
        WaterRecord previous = records.get(1);
        
        double waterConsumed = previous.getRemainingLiters() - latest.getRemainingLiters();
        if (waterConsumed < 0) {
            waterConsumed = 0;
        }
        
        Duration duration = Duration.between(previous.getReportTime(), latest.getReportTime());
        double hours = duration.toMinutes() / 60.0;
        
        if (hours <= 0) {
            return 0.0;
        }
        
        return waterConsumed / hours;
    }

    public LocalDateTime predictLowWaterTime(Double currentWater, Double consumptionRate) {
        if (consumptionRate <= 0 || currentWater <= lowWaterThreshold) {
            return null;
        }
        
        double waterToLow = currentWater - lowWaterThreshold;
        double hoursToLow = waterToLow / consumptionRate;
        
        return LocalDateTime.now().plusHours((long) hoursToLow);
    }

    public List<WaterRecord> getMachineHistory(Long machineId) {
        return recordRepository.findByMachineIdOrderByReportTimeDesc(machineId);
    }

    public void refilMachine(Long machineId) {
        WaterMachine machine = getMachineById(machineId);
        if (machine == null) {
            return;
        }
        
        MachineStatusDTO status = getMachineStatusFromCache(machineId);
        if (status != null) {
            status.setRemainingLiters(maxWaterCapacity);
            status.setIsLowWater(false);
            status.setLastReportTime(LocalDateTime.now());
            updateMachineStatusCache(status);
        }
        
        WaterRecord record = new WaterRecord();
        record.setMachineId(machineId);
        record.setRemainingLiters(maxWaterCapacity);
        record.setReportTime(LocalDateTime.now());
        recordRepository.save(record);
    }
}
