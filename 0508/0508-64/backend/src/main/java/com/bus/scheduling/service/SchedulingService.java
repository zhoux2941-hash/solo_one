package com.bus.scheduling.service;

import com.bus.scheduling.config.SchedulingProperties;
import com.bus.scheduling.dto.DriverEnergyDTO;
import com.bus.scheduling.dto.ScheduleDTO;
import com.bus.scheduling.dto.SchedulingRequestDTO;
import com.bus.scheduling.dto.SchedulingResultDTO;
import com.bus.scheduling.entity.Driver;
import com.bus.scheduling.entity.Schedule;
import com.bus.scheduling.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulingService {

    private final DriverService driverService;
    private final EnergyService energyService;
    private final ScheduleRepository scheduleRepository;
    private final SchedulingProperties properties;

    @Transactional
    public SchedulingResultDTO generateSchedule(SchedulingRequestDTO request) {
        LocalDate today = LocalDate.now();
        
        log.info("========== 开始生成排班 ==========");
        log.info("疲劳阈值: {}", properties.getFatigueThreshold());
        log.info("每小时精力消耗: {}", properties.getDrivingEnergyCostPerHour());

        List<String> warnings = new ArrayList<>();
        List<Schedule> allSchedules = new ArrayList<>();

        List<Driver> availableDrivers = driverService.getAllDrivers();
        log.info("司机总数: {}", availableDrivers.size());

        Map<Long, Integer> currentEnergies = new HashMap<>();
        for (Driver driver : availableDrivers) {
            int energy = energyService.getCurrentEnergy(driver.getId());
            currentEnergies.put(driver.getId(), energy);
            log.info("司机 {} ({}) 初始精力值: {}", driver.getName(), driver.getDriverNumber(), energy);
        }

        List<SchedulingRequestDTO.TimeSlotRequirement> sortedRequirements = request.getRequirements().stream()
                .sorted(Comparator.comparingInt(SchedulingRequestDTO.TimeSlotRequirement::getStartHour))
                .collect(Collectors.toList());

        Map<Long, LocalTime> lastEndTime = new HashMap<>();

        for (SchedulingRequestDTO.TimeSlotRequirement req : sortedRequirements) {
            LocalTime slotStart = LocalTime.of(req.getStartHour(), 0);
            LocalTime slotEnd = LocalTime.of(req.getEndHour(), 0);
            int drivingHours = req.getEndHour() - req.getStartHour();
            int energyCost = drivingHours * properties.getDrivingEnergyCostPerHour();

            log.info("----- 处理时段: {}-{}, 需要{}名司机, 每司机消耗精力{}", 
                    slotStart, slotEnd, req.getDriverCount(), energyCost);

            List<Driver> candidates = availableDrivers.stream()
                    .filter(d -> {
                        int currentEnergy = currentEnergies.get(d.getId());
                        boolean canDrive = currentEnergy >= properties.getFatigueThreshold();
                        boolean hasEnoughEnergy = currentEnergy >= energyCost;
                        boolean isAvailable = canDrive && hasEnoughEnergy;
                        
                        if (!canDrive) {
                            log.warn("司机 {} ({}) 精力值{} 低于疲劳阈值{}，排除", 
                                    d.getName(), d.getDriverNumber(), currentEnergy, properties.getFatigueThreshold());
                        } else if (!hasEnoughEnergy) {
                            log.warn("司机 {} ({}) 精力值{} 不足以支撑{}小时驾驶(需要{})，排除", 
                                    d.getName(), d.getDriverNumber(), currentEnergy, drivingHours, energyCost);
                        }
                        
                        return isAvailable;
                    })
                    .sorted((d1, d2) -> {
                        int energyCompare = currentEnergies.get(d2.getId()).compareTo(currentEnergies.get(d1.getId()));
                        if (energyCompare != 0) return energyCompare;
                        LocalTime end1 = lastEndTime.getOrDefault(d1.getId(), LocalTime.MIN);
                        LocalTime end2 = lastEndTime.getOrDefault(d2.getId(), LocalTime.MIN);
                        return end1.compareTo(end2);
                    })
                    .collect(Collectors.toList());

            log.info("可选司机数量: {}", candidates.size());
            for (Driver d : candidates) {
                log.info("  - {} ({}) 精力值: {}", d.getName(), d.getDriverNumber(), currentEnergies.get(d.getId()));
            }

            int toAssign = Math.min(req.getDriverCount(), candidates.size());
            if (toAssign < req.getDriverCount()) {
                String warning = String.format("时段 %02d:00-%02d:00 需要 %d 名司机，但只有 %d 名司机可用(精力不足)",
                        req.getStartHour(), req.getEndHour(), req.getDriverCount(), toAssign);
                warnings.add(warning);
                log.warn(warning);
            }

            for (int i = 0; i < toAssign; i++) {
                Driver driver = candidates.get(i);
                int energyBefore = currentEnergies.get(driver.getId());
                int energyAfter = energyBefore - energyCost;

                Schedule schedule = new Schedule();
                schedule.setDriver(driver);
                schedule.setScheduleDate(today);
                schedule.setTimeSlotStart(slotStart);
                schedule.setTimeSlotEnd(slotEnd);
                schedule.setEnergyBefore(energyBefore);
                schedule.setEnergyAfter(energyAfter);
                schedule.setType(Schedule.ScheduleType.DRIVING);
                allSchedules.add(schedule);

                currentEnergies.put(driver.getId(), energyAfter);
                lastEndTime.put(driver.getId(), slotEnd);

                log.info("排班: {} ({}) {}-{}, 精力: {} -> {}", 
                        driver.getName(), driver.getDriverNumber(), 
                        slotStart, slotEnd, energyBefore, energyAfter);
            }
        }

        log.info("保存 {} 条排班记录", allSchedules.size());
        scheduleRepository.saveAll(allSchedules);

        log.info("更新 Redis 精力值:");
        for (Map.Entry<Long, Integer> entry : currentEnergies.entrySet()) {
            energyService.setCurrentEnergy(entry.getKey(), entry.getValue());
            Driver driver = availableDrivers.stream()
                    .filter(d -> d.getId().equals(entry.getKey()))
                    .findFirst().orElse(null);
            if (driver != null) {
                log.info("  - {} ({}) 最终精力值: {}", 
                        driver.getName(), driver.getDriverNumber(), entry.getValue());
            }
        }

        List<ScheduleDTO> scheduleDTOs = allSchedules.stream()
                .map(s -> new ScheduleDTO(
                        s.getId(),
                        s.getDriver().getId(),
                        s.getDriver().getName(),
                        s.getDriver().getDriverNumber(),
                        s.getTimeSlotStart(),
                        s.getTimeSlotEnd(),
                        s.getEnergyBefore(),
                        s.getEnergyAfter(),
                        s.getType().name()
                ))
                .sorted(Comparator.comparing(ScheduleDTO::getTimeSlotStart)
                        .thenComparing(ScheduleDTO::getDriverNumber))
                .collect(Collectors.toList());

        List<DriverEnergyDTO> energies = energyService.getAllDriverEnergies();

        log.info("========== 排班完成 ==========");
        log.info("返回的司机精力值:");
        for (DriverEnergyDTO e : energies) {
            log.info("  - {} ({}): {}", e.getDriverName(), e.getDriverNumber(), e.getCurrentEnergy());
        }
        
        return new SchedulingResultDTO(
                true,
                warnings.isEmpty() ? "排班成功" : "排班完成，但存在警告",
                scheduleDTOs,
                energies,
                warnings
        );
    }

    public List<ScheduleDTO> getTodaySchedules() {
        LocalDate today = LocalDate.now();
        List<Schedule> schedules = scheduleRepository
                .findByScheduleDateOrderByDriverIdAscTimeSlotStartAsc(today);
        return schedules.stream()
                .map(s -> new ScheduleDTO(
                        s.getId(),
                        s.getDriver().getId(),
                        s.getDriver().getName(),
                        s.getDriver().getDriverNumber(),
                        s.getTimeSlotStart(),
                        s.getTimeSlotEnd(),
                        s.getEnergyBefore(),
                        s.getEnergyAfter(),
                        s.getType().name()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void resetTodaySchedule() {
        LocalDate today = LocalDate.now();
        scheduleRepository.deleteByScheduleDate(today);
        energyService.resetAllEnergies();
    }
}
