package com.pool.service;

import com.pool.dto.DailyAverageDTO;
import com.pool.dto.LaneToleranceDTO;
import com.pool.entity.LaneTolerance;
import com.pool.repository.LaneToleranceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LaneToleranceService {

    @Autowired
    private LaneToleranceRepository laneToleranceRepository;

    public List<LaneToleranceDTO> getAllLanes() {
        LocalDate today = LocalDate.now();
        return getLanesByDate(today);
    }

    public List<LaneToleranceDTO> getLanesByDate(LocalDate date) {
        List<LaneTolerance> lanes = laneToleranceRepository.findByRecordDateOrderedByZone(date);
        if (lanes.isEmpty()) {
            LocalDate latestDate = findLatestAvailableDate();
            if (latestDate != null) {
                lanes = laneToleranceRepository.findByRecordDateOrderedByZone(latestDate);
            }
        }
        return lanes.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<LaneToleranceDTO> getLanesByZone(String zone) {
        return laneToleranceRepository.findByZoneOrderByIdAsc(zone).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DailyAverageDTO> getDailyAverages(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = laneToleranceRepository.findAverageByDateRange(startDate, endDate);
        return results.stream()
                .map(row -> new DailyAverageDTO(
                        (LocalDate) row[0],
                        ((Number) row[1]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public LocalDate findLatestAvailableDate() {
        return laneToleranceRepository.findAll().stream()
                .map(LaneTolerance::getRecordDate)
                .max(LocalDate::compareTo)
                .orElse(null);
    }

    private LaneToleranceDTO convertToDTO(LaneTolerance entity) {
        return new LaneToleranceDTO(
                entity.getLaneName(),
                entity.getToleranceValue(),
                entity.getZone(),
                entity.getRecordDate()
        );
    }
}
