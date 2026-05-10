package com.graftingassistant.service;

import com.graftingassistant.algorithm.BayesianAverageCalculator;
import com.graftingassistant.dto.GraftingRecordDTO;
import com.graftingassistant.entity.GraftingRecord;
import com.graftingassistant.entity.Plant;
import com.graftingassistant.repository.GraftingRecordRepository;
import com.graftingassistant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GraftingRecordService {
    
    private final GraftingRecordRepository recordRepository;
    private final PlantRepository plantRepository;
    private final CompatibilityService compatibilityService;
    private final BayesianAverageCalculator bayesianCalculator;
    private final ReminderService reminderService;
    
    @Transactional
    public GraftingRecord createRecord(GraftingRecordDTO dto) {
        GraftingRecord record = new GraftingRecord();
        
        Plant rootstock = plantRepository.getReferenceById(dto.getRootstockId());
        Plant scion = plantRepository.getReferenceById(dto.getScionId());
        
        record.setRootstock(rootstock);
        record.setScion(scion);
        record.setGraftingDate(dto.getGraftingDate());
        record.setMethod(GraftingRecord.GraftingMethod.valueOf(dto.getMethod()));
        record.setTotalCount(dto.getTotalCount());
        record.setNotes(dto.getNotes());
        record.setIsCompleted(false);
        
        GraftingRecord savedRecord = recordRepository.save(record);
        
        reminderService.generateRemindersForRecord(savedRecord.getId());
        
        return savedRecord;
    }
    
    @Transactional
    public GraftingRecord updateSurvival(Long recordId, Integer survivalCount) {
        GraftingRecord record = recordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("Record not found"));
        
        record.setSurvivalCount(survivalCount);
        
        BigDecimal survivalRate = bayesianCalculator.calculateSurvivalRate(
            survivalCount, record.getTotalCount());
        record.setSurvivalRate(survivalRate);
        record.setIsCompleted(true);
        
        GraftingRecord saved = recordRepository.save(record);
        
        compatibilityService.updateCompatibilityScore(
            saved.getRootstock().getId(), saved.getScion().getId());
        
        return saved;
    }
    
    public List<GraftingRecord> getAllRecords() {
        return recordRepository.findAll();
    }
    
    public Map<Integer, BigDecimal> getBestGraftingSeason(Long rootstockId, Long scionId) {
        List<Object[]> results = recordRepository.findMonthlySurvivalRate(rootstockId, scionId);
        
        Map<Integer, BigDecimal> monthlyRates = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            monthlyRates.put(i, BigDecimal.ZERO);
        }
        
        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            BigDecimal avgRate = (BigDecimal) result[1];
            monthlyRates.put(month, avgRate);
        }
        
        return monthlyRates;
    }
}
