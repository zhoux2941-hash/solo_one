package com.aquarium.phmonitor.service;

import com.aquarium.phmonitor.dto.PhRecordDto;
import com.aquarium.phmonitor.dto.TankPhData;
import com.aquarium.phmonitor.entity.PhRecord;
import com.aquarium.phmonitor.repository.PhRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PhRecordService {

    @Autowired
    private PhRecordRepository phRecordRepository;

    @Value("${app.ph.min:7.8}")
    private double phMin;

    @Value("${app.ph.max:8.4}")
    private double phMax;

    @Value("#{'${app.tanks}'.split(',')}")
    private List<String> tankNames;

    public boolean isPhAbnormal(double ph) {
        return ph < phMin || ph > phMax;
    }

    public List<String> getAllTankNames() {
        return Arrays.asList("珊瑚缸", "鲨鱼缸", "热带鱼缸", "水母缸", "海龟缸", "企鹅缸", "海獭缸", "巨藻缸");
    }

    public List<TankPhData> getAllTanksLast24Hours() {
        LocalDateTime endTime = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startTime = endTime.minusHours(24);

        List<String> tanks = getAllTankNames();
        List<TankPhData> result = new ArrayList<>();

        for (String tank : tanks) {
            List<PhRecord> records = phRecordRepository
                .findByTankNameAndRecordTimeBetweenOrderByRecordTimeAsc(tank, startTime, endTime);
            
            if (records.isEmpty()) {
                records = generateMockLast24Hours(tank, startTime, endTime);
                phRecordRepository.saveAll(records);
            }

            result.add(convertToTankPhData(tank, records));
        }

        return result;
    }

    public TankPhData getTankDataByTimeRange(String tankName, LocalDateTime startTime, LocalDateTime endTime) {
        List<PhRecord> records = phRecordRepository
            .findByTankNameAndRecordTimeBetweenOrderByRecordTimeAsc(tankName, startTime, endTime);
        return convertToTankPhData(tankName, records);
    }

    public List<TankPhData> getAllTanksByTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        List<String> tanks = getAllTankNames();
        List<TankPhData> result = new ArrayList<>();

        for (String tank : tanks) {
            result.add(getTankDataByTimeRange(tank, startTime, endTime));
        }

        return result;
    }

    private TankPhData convertToTankPhData(String tankName, List<PhRecord> records) {
        List<PhRecordDto> dtos = records.stream()
            .map(r -> new PhRecordDto(r.getPhValue(), r.getRecordTime(), r.getIsAbnormal()))
            .collect(Collectors.toList());

        int total = records.size();
        int abnormal = (int) records.stream().filter(PhRecord::getIsAbnormal).count();
        double rate = total > 0 ? (double) abnormal / total * 100 : 0.0;

        return new TankPhData(tankName, dtos, rate, abnormal, total);
    }

    private List<PhRecord> generateMockLast24Hours(String tankName, LocalDateTime startTime, LocalDateTime endTime) {
        List<PhRecord> records = new ArrayList<>();
        LocalDateTime current = startTime;

        while (current.isBefore(endTime) || current.isEqual(endTime)) {
            double ph = generateMockPhValue(tankName);
            boolean abnormal = isPhAbnormal(ph);
            records.add(new PhRecord(tankName, ph, current, abnormal));
            current = current.plusHours(1);
        }

        return records;
    }

    public double generateMockPhValue(String tankName) {
        Random random = new Random();
        double center = (phMin + phMax) / 2.0;
        double range = (phMax - phMin) / 2.0;

        double volatility;
        double anomalyChance;

        if ("珊瑚缸".equals(tankName) || "水母缸".equals(tankName)) {
            volatility = 0.6;
            anomalyChance = 0.35;
        } else {
            volatility = 0.25;
            anomalyChance = 0.08;
        }

        if (random.nextDouble() < anomalyChance) {
            double direction = random.nextBoolean() ? 1 : -1;
            double anomalyAmount = range * (0.3 + random.nextDouble() * 0.5);
            return Math.round((center + direction * (range + anomalyAmount)) * 100.0) / 100.0;
        } else {
            double variation = (random.nextGaussian() * volatility * range);
            double ph = center + variation;
            ph = Math.max(phMin, Math.min(phMax, ph));
            return Math.round(ph * 100.0) / 100.0;
        }
    }
}
