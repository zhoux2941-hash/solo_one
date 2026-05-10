package com.cinema.popcorn.service;

import com.cinema.popcorn.config.PopcornProperties;
import com.cinema.popcorn.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueueTheoryService {

    private final PopcornProperties properties;

    @Cacheable(value = "optimization", key = "#request.expectedPassengers + '-' + #request.isHoliday")
    public OptimizationResponse optimizeScheduling(OptimizationRequest request) {
        log.info("开始计算最优排班方案，预期客流量: {}", request.getExpectedPassengers());
        
        int totalMachines = properties.getTotalMachines();
        int warmupMinutes = properties.getWarmupMinutes();
        int peakStartHour = properties.getPeakStartHour();
        int peakEndHour = properties.getPeakEndHour();
        int serviceRatePerMachine = properties.getServiceRatePerMachine();
        int maxQueueLength = properties.getMaxQueueLength();

        List<Integer> hourlyDistribution = request.getHourlyDistribution();
        if (hourlyDistribution == null || hourlyDistribution.isEmpty()) {
            hourlyDistribution = generateDefaultDistribution(request.getExpectedPassengers(), peakStartHour, peakEndHour);
        }

        List<MachineSchedule> schedules = new ArrayList<>();
        List<QueueDataPoint> queueCurve = new ArrayList<>();
        
        Map<Integer, Integer> machinesNeededPerHour = calculateMachinesNeeded(
            hourlyDistribution, serviceRatePerMachine, maxQueueLength, totalMachines
        );

        schedules = generateMachineSchedules(machinesNeededPerHour, warmupMinutes, peakStartHour, totalMachines);
        
        queueCurve = simulateQueue(hourlyDistribution, schedules, serviceRatePerMachine, peakStartHour);

        double avgWaitingTime = queueCurve.stream()
                .mapToDouble(QueueDataPoint::getWaitingTime)
                .average()
                .orElse(0.0);

        long machinesUsed = schedules.stream()
                .map(MachineSchedule::getMachineId)
                .distinct()
                .count();

        String recommendation = generateRecommendation(schedules, avgWaitingTime, machinesUsed);
        
        CostComparison costComparison = calculateCostComparison(
            schedules, 
            machinesNeededPerHour, 
            warmupMinutes,
            peakStartHour,
            peakEndHour,
            totalMachines
        );

        return OptimizationResponse.builder()
                .schedules(schedules)
                .queueCurve(queueCurve)
                .recommendation(recommendation)
                .totalMachinesUsed((int) machinesUsed)
                .avgWaitingTime(Math.round(avgWaitingTime * 10.0) / 10.0)
                .costComparison(costComparison)
                .build();
    }
    
    private CostComparison calculateCostComparison(
            List<MachineSchedule> optimizedSchedules,
            Map<Integer, Integer> machinesNeededPerHour,
            int warmupMinutes,
            int peakStartHour,
            int peakEndHour,
            int totalMachines
    ) {
        double warmupPowerKw = properties.getWarmupPowerKw();
        double runningPowerKw = properties.getRunningPowerKw();
        double pricePerKwh = properties.getElectricityPricePerKwh();

        StrategyCost advancedWarmupCost = calculateStrategyCost(
            optimizedSchedules,
            warmupMinutes,
            warmupPowerKw,
            runningPowerKw,
            pricePerKwh,
            "提前预热策略（智能排班）"
        );

        List<MachineSchedule> instantOnSchedules = generateInstantOnSchedules(
            machinesNeededPerHour,
            warmupMinutes,
            peakStartHour,
            peakEndHour,
            totalMachines
        );

        StrategyCost instantOnCost = calculateStrategyCost(
            instantOnSchedules,
            warmupMinutes,
            warmupPowerKw,
            runningPowerKw,
            pricePerKwh,
            "临时开启策略（高峰期全开）"
        );

        double savingsAmount = Math.round((instantOnCost.getTotalCost() - advancedWarmupCost.getTotalCost()) * 100.0) / 100.0;
        double savingsPercentage = instantOnCost.getTotalCost() > 0 
            ? Math.round((savingsAmount / instantOnCost.getTotalCost() * 100) * 10.0) / 10.0
            : 0;

        String costRecommendation = generateCostRecommendation(
            savingsAmount, 
            savingsPercentage,
            advancedWarmupCost,
            instantOnCost
        );

        return CostComparison.builder()
            .advancedWarmup(advancedWarmupCost)
            .instantOn(instantOnCost)
            .savingsAmount(savingsAmount)
            .savingsPercentage(savingsPercentage)
            .recommendation(costRecommendation)
            .build();
    }
    
    private StrategyCost calculateStrategyCost(
            List<MachineSchedule> schedules,
            int warmupMinutes,
            double warmupPowerKw,
            double runningPowerKw,
            double pricePerKwh,
            String strategyName
    ) {
        double totalWarmupMinutes = 0;
        double totalRunningMinutes = 0;
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (MachineSchedule schedule : schedules) {
            LocalTime start = LocalTime.parse(schedule.getStartTime(), timeFormatter);
            LocalTime end = LocalTime.parse(schedule.getEndTime(), timeFormatter);
            
            double durationMinutes = java.time.Duration.between(start, end).toMinutes();
            
            if (durationMinutes >= warmupMinutes) {
                totalWarmupMinutes += warmupMinutes;
                totalRunningMinutes += (durationMinutes - warmupMinutes);
            } else {
                totalWarmupMinutes += durationMinutes;
            }
        }

        double warmupEnergyKwh = (totalWarmupMinutes / 60.0) * warmupPowerKw;
        double runningEnergyKwh = (totalRunningMinutes / 60.0) * runningPowerKw;
        double totalEnergyKwh = warmupEnergyKwh + runningEnergyKwh;
        double totalCost = Math.round(totalEnergyKwh * pricePerKwh * 100.0) / 100.0;

        return StrategyCost.builder()
            .strategyName(strategyName)
            .totalMinutes(Math.round((totalWarmupMinutes + totalRunningMinutes) * 10.0) / 10.0)
            .warmupMinutes(Math.round(totalWarmupMinutes * 10.0) / 10.0)
            .runningMinutes(Math.round(totalRunningMinutes * 10.0) / 10.0)
            .warmupEnergyKwh(Math.round(warmupEnergyKwh * 100.0) / 100.0)
            .runningEnergyKwh(Math.round(runningEnergyKwh * 100.0) / 100.0)
            .totalEnergyKwh(Math.round(totalEnergyKwh * 100.0) / 100.0)
            .totalCost(totalCost)
            .build();
    }
    
    private List<MachineSchedule> generateInstantOnSchedules(
            Map<Integer, Integer> machinesNeededPerHour,
            int warmupMinutes,
            int peakStartHour,
            int peakEndHour,
            int totalMachines
    ) {
        List<MachineSchedule> schedules = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        int maxMachinesNeeded = machinesNeededPerHour.values().stream()
            .mapToInt(Integer::intValue)
            .max()
            .orElse(1);

        LocalTime peakStart = LocalTime.of(peakStartHour, 0);
        LocalTime peakEnd = LocalTime.of(peakEndHour, 0);
        LocalTime warmupStart = peakStart.minusMinutes(warmupMinutes);

        for (int m = 1; m <= Math.min(maxMachinesNeeded, totalMachines); m++) {
            schedules.add(MachineSchedule.builder()
                .machineId(m)
                .startTime(warmupStart.format(timeFormatter))
                .endTime(peakEnd.format(timeFormatter))
                .status("active")
                .action("start")
                .build());
        }

        return schedules;
    }
    
    private String generateCostRecommendation(
            double savingsAmount,
            double savingsPercentage,
            StrategyCost advancedWarmup,
            StrategyCost instantOn
    ) {
        StringBuilder sb = new StringBuilder();
        
        if (savingsAmount > 0) {
            sb.append(String.format("💰 采用智能预热策略可节省 %.2f 元（%.1f%%）\n\n", 
                savingsAmount, savingsPercentage));
            sb.append("智能预热策略优势：\n");
            sb.append("• 根据客流需求动态调整开机时间\n");
            sb.append("• 避免机器空转浪费电力\n");
            sb.append("• 预热阶段功率较高（2kW），运行阶段较低（1.5kW）\n\n");
        } else if (savingsAmount < 0) {
            sb.append("⚠️ 临时开启策略在本场景下成本略低\n\n");
        } else {
            sb.append("两种策略成本相当\n\n");
        }
        
        sb.append(String.format("智能排班成本: %.2f 元 (%.2f kWh)\n", 
            advancedWarmup.getTotalCost(), advancedWarmup.getTotalEnergyKwh()));
        sb.append(String.format("临时开启成本: %.2f 元 (%.2f kWh)\n", 
            instantOn.getTotalCost(), instantOn.getTotalEnergyKwh()));
        
        return sb.toString();
    }

    private List<Integer> generateDefaultDistribution(int totalPassengers, int peakStart, int peakEnd) {
        List<Integer> distribution = new ArrayList<>();
        int peakHours = peakEnd - peakStart;
        int peakPassengers = (int) (totalPassengers * 0.6);
        int perPeakHour = peakPassengers / peakHours;
        int remaining = totalPassengers - peakPassengers;
        int prePeak = (int) (remaining * 0.5);
        int postPeak = remaining - prePeak;

        for (int hour = 0; hour < 24; hour++) {
            if (hour < peakStart - 2) {
                distribution.add(0);
            } else if (hour == peakStart - 2) {
                distribution.add(prePeak / 2);
            } else if (hour == peakStart - 1) {
                distribution.add(prePeak / 2);
            } else if (hour >= peakStart && hour < peakEnd) {
                distribution.add(perPeakHour);
            } else if (hour == peakEnd) {
                distribution.add(postPeak / 2);
            } else if (hour == peakEnd + 1) {
                distribution.add(postPeak / 2);
            } else {
                distribution.add(0);
            }
        }
        return distribution;
    }

    private Map<Integer, Integer> calculateMachinesNeeded(
            List<Integer> hourlyDistribution,
            int serviceRatePerMachine,
            int maxQueueLength,
            int maxMachines
    ) {
        Map<Integer, Integer> machinesNeeded = new HashMap<>();

        for (int hour = 0; hour < hourlyDistribution.size(); hour++) {
            int passengers = hourlyDistribution.get(hour);
            if (passengers == 0) {
                machinesNeeded.put(hour, 0);
                continue;
            }

            double arrivalRate = passengers / 60.0;
            int neededMachines = 1;

            for (int m = 1; m <= maxMachines; m++) {
                double serviceRate = m * serviceRatePerMachine / 60.0;
                
                if (serviceRate > arrivalRate) {
                    double rho = arrivalRate / serviceRate;
                    double p0 = calculateP0(rho, m);
                    double lq = (Math.pow(rho, m) * rho * p0) / (factorial(m) * Math.pow(1 - rho, 2));
                    
                    if (lq <= maxQueueLength) {
                        neededMachines = m;
                        break;
                    }
                }
                neededMachines = m;
            }
            machinesNeeded.put(hour, neededMachines);
        }
        return machinesNeeded;
    }

    private double calculateP0(double rho, int m) {
        double sum = 0;
        for (int i = 0; i < m; i++) {
            sum += Math.pow(rho * m, i) / factorial(i);
        }
        sum += Math.pow(rho * m, m) / (factorial(m) * (1 - rho));
        return 1.0 / sum;
    }

    private long factorial(int n) {
        if (n <= 1) return 1;
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    private List<MachineSchedule> generateMachineSchedules(
            Map<Integer, Integer> machinesNeededPerHour,
            int warmupMinutes,
            int peakStartHour,
            int totalMachines
    ) {
        List<MachineSchedule> schedules = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        Map<Integer, LocalTime> machineStartTime = new HashMap<>();
        Map<Integer, LocalTime> machineEndTime = new HashMap<>();

        for (int hour = 0; hour < 24; hour++) {
            int needed = machinesNeededPerHour.getOrDefault(hour, 0);
            if (needed == 0) continue;

            LocalTime hourStart = LocalTime.of(hour, 0);
            LocalTime warmupStart = hourStart.minusMinutes(warmupMinutes);

            for (int m = 1; m <= needed; m++) {
                if (!machineStartTime.containsKey(m)) {
                    machineStartTime.put(m, warmupStart);
                }
                machineEndTime.put(m, LocalTime.of(hour + 1, 0));
            }
        }

        for (int m = 1; m <= totalMachines; m++) {
            if (machineStartTime.containsKey(m)) {
                LocalTime start = machineStartTime.get(m);
                LocalTime end = machineEndTime.get(m);
                
                schedules.add(MachineSchedule.builder()
                        .machineId(m)
                        .startTime(start.format(timeFormatter))
                        .endTime(end.format(timeFormatter))
                        .status("active")
                        .action("start")
                        .build());
            }
        }

        schedules.sort(Comparator.comparing(MachineSchedule::getStartTime));
        return schedules;
    }

    private List<QueueDataPoint> simulateQueue(
            List<Integer> hourlyDistribution,
            List<MachineSchedule> schedules,
            int serviceRatePerMachine,
            int peakStartHour
    ) {
        List<QueueDataPoint> curve = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        int startHour = Math.max(0, peakStartHour - 2);
        int endHour = Math.min(23, peakStartHour + 4);

        for (int hour = startHour; hour <= endHour; hour++) {
            for (int minute = 0; minute < 60; minute += 15) {
                LocalTime currentTime = LocalTime.of(hour, minute);
                
                int activeMachines = getActiveMachines(schedules, currentTime);
                int passengersThisHour = hourlyDistribution.get(hour);
                double arrivalRate = passengersThisHour / 60.0;
                double serviceRate = activeMachines * serviceRatePerMachine / 60.0;

                double queueLength = 0;
                double waitingTime = 0;

                if (activeMachines > 0 && serviceRate > arrivalRate) {
                    double rho = arrivalRate / serviceRate;
                    double p0 = calculateP0(rho, activeMachines);
                    queueLength = (Math.pow(rho, activeMachines) * rho * p0) / 
                            (factorial(activeMachines) * Math.pow(1 - rho, 2));
                    
                    if (queueLength < 0 || Double.isInfinite(queueLength)) {
                        queueLength = 0;
                    }
                    
                    if (arrivalRate > 0) {
                        waitingTime = queueLength / arrivalRate;
                    }
                }

                curve.add(QueueDataPoint.builder()
                        .time(currentTime.format(timeFormatter))
                        .queueLength(Math.round(queueLength * 10.0) / 10.0)
                        .activeMachines(activeMachines)
                        .waitingTime(Math.round(waitingTime * 10.0) / 10.0)
                        .build());
            }
        }
        return curve;
    }

    private int getActiveMachines(List<MachineSchedule> schedules, LocalTime currentTime) {
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        int count = 0;
        
        for (MachineSchedule schedule : schedules) {
            LocalTime start = LocalTime.parse(schedule.getStartTime(), timeFormatter);
            LocalTime end = LocalTime.parse(schedule.getEndTime(), timeFormatter);
            
            if (!currentTime.isBefore(start) && currentTime.isBefore(end)) {
                count++;
            }
        }
        return count;
    }

    private String generateRecommendation(List<MachineSchedule> schedules, double avgWaitingTime, long machinesUsed) {
        StringBuilder sb = new StringBuilder();
        sb.append("根据排队论模型分析，建议排班如下：\n\n");
        
        for (MachineSchedule schedule : schedules) {
            sb.append(String.format("• %s: %s 开启第 %d 台机器，运行至 %s\n",
                    schedule.getAction(),
                    schedule.getStartTime(),
                    schedule.getMachineId(),
                    schedule.getEndTime()));
        }
        
        sb.append(String.format("\n预计平均等待时间: %.1f 分钟", avgWaitingTime));
        sb.append(String.format("\n预计使用机器数量: %d 台", machinesUsed));
        
        if (avgWaitingTime > 2) {
            sb.append("\n\n⚠️ 提示：高峰期客流较大，建议提前做好准备");
        } else if (avgWaitingTime < 0.5) {
            sb.append("\n\n✅ 提示：当前排班方案效率较高，等待时间较短");
        }
        
        return sb.toString();
    }
}
