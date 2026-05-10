package com.beekeeper.service;

import com.beekeeper.dto.ComparisonDataDTO;
import com.beekeeper.entity.Beehive;
import com.beekeeper.entity.HiveRecord;
import com.beekeeper.repository.BeehiveRepository;
import com.beekeeper.repository.HiveRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonService {
    
    private final BeehiveRepository beehiveRepository;
    private final HiveRecordRepository hiveRecordRepository;
    
    public ComparisonDataDTO getComparisonData(List<Long> beehiveIds, LocalDate startDate, LocalDate endDate) {
        ComparisonDataDTO dto = new ComparisonDataDTO();
        
        List<Beehive> beehives = beehiveRepository.findAllById(beehiveIds);
        Map<Long, String> hiveNumbers = beehives.stream()
                .collect(Collectors.toMap(Beehive::getId, Beehive::getHiveNumber));
        dto.setHiveNumbers(hiveNumbers);
        
        List<HiveRecord> allRecords = hiveRecordRepository
                .findByBeehiveIdsAndRecordDateBetween(beehiveIds, startDate, endDate);
        
        List<LocalDate> dateRange = startDate.datesUntil(endDate.plusDays(1))
                .collect(Collectors.toList());
        List<String> dateStrings = dateRange.stream()
                .map(LocalDate::toString)
                .collect(Collectors.toList());
        dto.setDates(dateStrings);
        
        Map<Long, List<Double>> morningTemps = new HashMap<>();
        Map<Long, List<Double>> eveningTemps = new HashMap<>();
        Map<Long, List<Integer>> activityLevels = new HashMap<>();
        
        for (Long hiveId : beehiveIds) {
            Map<LocalDate, HiveRecord> recordMap = allRecords.stream()
                    .filter(r -> r.getBeehive().getId().equals(hiveId))
                    .collect(Collectors.toMap(HiveRecord::getRecordDate, r -> r));
            
            List<Double> hiveMorningTemps = new ArrayList<>();
            List<Double> hiveEveningTemps = new ArrayList<>();
            List<Integer> hiveActivities = new ArrayList<>();
            
            for (LocalDate date : dateRange) {
                HiveRecord record = recordMap.get(date);
                if (record != null) {
                    hiveMorningTemps.add(record.getMorningTemperature());
                    hiveEveningTemps.add(record.getEveningTemperature());
                    hiveActivities.add(record.getActivityLevel());
                } else {
                    hiveMorningTemps.add(null);
                    hiveEveningTemps.add(null);
                    hiveActivities.add(null);
                }
            }
            
            morningTemps.put(hiveId, hiveMorningTemps);
            eveningTemps.put(hiveId, hiveEveningTemps);
            activityLevels.put(hiveId, hiveActivities);
        }
        
        dto.setMorningTemperatures(morningTemps);
        dto.setEveningTemperatures(eveningTemps);
        dto.setActivityLevels(activityLevels);
        
        return dto;
    }
    
    public ComparisonDataDTO getDefaultComparisonData(List<Long> beehiveIds) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(14);
        return getComparisonData(beehiveIds, startDate, today);
    }
}
