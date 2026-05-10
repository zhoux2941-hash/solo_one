package com.canteen.service;

import com.canteen.dto.DailySummaryDTO;
import com.canteen.entity.FoodWaste;
import com.canteen.repository.FoodWasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FoodWasteService {

    @Autowired
    private FoodWasteRepository foodWasteRepository;

    public List<DailySummaryDTO> getRecentData(int days) {
        List<FoodWaste> allRecords = foodWasteRepository.findAllByOrderByRecordDateDesc();
        if (allRecords.isEmpty()) {
            return Collections.emptyList();
        }
        
        Set<LocalDate> uniqueDates = new LinkedHashSet<>();
        for (FoodWaste record : allRecords) {
            uniqueDates.add(record.getRecordDate());
            if (uniqueDates.size() >= days) {
                break;
            }
        }
        
        LocalDate oldestDate = new ArrayList<>(uniqueDates).get(uniqueDates.size() - 1);
        List<FoodWaste> recentRecords = allRecords.stream()
                .filter(r -> !r.getRecordDate().isBefore(oldestDate))
                .collect(Collectors.toList());
        
        return aggregateByDate(recentRecords);
    }

    private List<DailySummaryDTO> aggregateByDate(List<FoodWaste> records) {
        Map<LocalDate, DailySummaryDTO> dateMap = new TreeMap<>();

        for (FoodWaste record : records) {
            LocalDate date = record.getRecordDate();
            DailySummaryDTO summary = dateMap.computeIfAbsent(date,
                    k -> DailySummaryDTO.builder()
                            .date(date)
                            .lunch(BigDecimal.ZERO)
                            .dinner(BigDecimal.ZERO)
                            .total(BigDecimal.ZERO)
                            .build());

            if ("午餐".equals(record.getMealType())) {
                summary.setLunch(record.getWeightKg());
            } else if ("晚餐".equals(record.getMealType())) {
                summary.setDinner(record.getWeightKg());
            }
            summary.setTotal(summary.getLunch().add(summary.getDinner()));
        }

        return new ArrayList<>(dateMap.values());
    }
}
