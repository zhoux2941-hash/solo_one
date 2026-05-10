package com.flower.preservative.service;

import com.flower.preservative.dto.CustomFormulaDTO;
import com.flower.preservative.dto.ExperimentRecordDTO;
import com.flower.preservative.dto.FormulaComparisonDTO;
import com.flower.preservative.dto.SimulationResultDTO;
import com.flower.preservative.entity.CustomFormula;
import com.flower.preservative.entity.ExperimentRecord;
import com.flower.preservative.repository.CustomFormulaRepository;
import com.flower.preservative.repository.ExperimentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomDataService {
    
    private final CustomFormulaRepository customFormulaRepository;
    private final ExperimentRecordRepository experimentRecordRepository;
    
    private static final long TEMP_EXPIRE_HOURS = 72;
    
    public String getOrCreateSessionId(String existingSessionId) {
        if (existingSessionId != null && !existingSessionId.isEmpty()) {
            return existingSessionId;
        }
        return UUID.randomUUID().toString().replace("-", "");
    }
    
    private LocalDateTime getExpiryTime() {
        return LocalDateTime.now().plusHours(TEMP_EXPIRE_HOURS);
    }
    
    public CustomFormulaDTO saveCustomFormula(String sessionId, CustomFormulaDTO dto) {
        if (dto.getFreshDays() == null || dto.getFreshDays() <= 0) {
            dto.setFreshDays(calculateFreshDays(dto));
        }
        if (dto.getCost() == null) {
            dto.setCost(calculateCost(dto));
        }
        if (dto.getEaseOfUse() == null) {
            dto.setEaseOfUse(calculateEaseOfUse(dto));
        }
        
        CustomFormula formula = new CustomFormula();
        formula.setSessionId(sessionId);
        formula.setFormulaCode("D");
        formula.setFormulaName(dto.getFormulaName() != null ? dto.getFormulaName() : "自定义配方");
        formula.setSugarRatio(dto.getSugarRatio());
        formula.setBleachRatio(dto.getBleachRatio());
        formula.setCitricAcidRatio(dto.getCitricAcidRatio());
        formula.setOtherIngredients(dto.getOtherIngredients());
        formula.setFreshDays(dto.getFreshDays());
        formula.setCost(dto.getCost());
        formula.setEaseOfUse(dto.getEaseOfUse());
        formula.setDescription(dto.getDescription());
        formula.setIsLoggedIn(false);
        formula.setExpiresAt(getExpiryTime());
        
        Optional<CustomFormula> existingOpt = customFormulaRepository.findBySessionIdAndFormulaCode(sessionId, "D");
        if (existingOpt.isPresent()) {
            CustomFormula existing = existingOpt.get();
            formula.setId(existing.getId());
            formula.setCreatedAt(existing.getCreatedAt());
        }
        
        CustomFormula saved = customFormulaRepository.save(formula);
        return convertToFormulaDTO(saved);
    }
    
    public Optional<CustomFormulaDTO> getCustomFormula(String sessionId) {
        Optional<CustomFormula> opt = customFormulaRepository.findBySessionIdAndFormulaCode(sessionId, "D");
        return opt.map(this::convertToFormulaDTO);
    }
    
    public boolean deleteCustomFormula(String sessionId) {
        Optional<CustomFormula> opt = customFormulaRepository.findBySessionIdAndFormulaCode(sessionId, "D");
        if (opt.isPresent()) {
            customFormulaRepository.delete(opt.get());
            return true;
        }
        return false;
    }
    
    public FormulaComparisonDTO getCustomFormulaForRadar(String sessionId) {
        Optional<CustomFormulaDTO> opt = getCustomFormula(sessionId);
        return opt.map(dto -> new FormulaComparisonDTO(
                dto.getFormulaCode(),
                dto.getFormulaName(),
                dto.getFreshDays(),
                dto.getCost(),
                dto.getEaseOfUse()
        )).orElse(null);
    }
    
    public ExperimentRecordDTO saveExperimentRecord(
            String sessionId,
            String flowerType,
            Integer experimentDays,
            List<SimulationResultDTO> simulationResults,
            String recommendedFormula,
            String note) {
        
        ExperimentRecord record = new ExperimentRecord();
        record.setSessionId(sessionId);
        record.setFlowerType(flowerType);
        record.setExperimentDays(experimentDays);
        record.setRecommendedFormula(recommendedFormula);
        record.setNote(note);
        record.setIsLoggedIn(false);
        record.setExpiresAt(getExpiryTime());
        
        for (SimulationResultDTO result : simulationResults) {
            switch (result.getFormulaCode()) {
                case "A":
                    record.setFormulaAResult(result.getWitheringPercentage());
                    record.setFormulaAStatus(result.getStatus());
                    break;
                case "B":
                    record.setFormulaBResult(result.getWitheringPercentage());
                    record.setFormulaBStatus(result.getStatus());
                    break;
                case "C":
                    record.setFormulaCResult(result.getWitheringPercentage());
                    record.setFormulaCStatus(result.getStatus());
                    break;
                case "D":
                    record.setFormulaDResult(result.getWitheringPercentage());
                    record.setFormulaDStatus(result.getStatus());
                    record.setFormulaDExists(true);
                    record.setFormulaDName(result.getFormulaName());
                    break;
            }
        }
        
        ExperimentRecord saved = experimentRecordRepository.save(record);
        return convertToRecordDTO(saved);
    }
    
    public List<ExperimentRecordDTO> getExperimentRecords(String sessionId) {
        List<ExperimentRecord> records = experimentRecordRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        List<ExperimentRecordDTO> dtos = new ArrayList<>();
        for (ExperimentRecord record : records) {
            dtos.add(convertToRecordDTO(record));
        }
        return dtos;
    }
    
    public boolean deleteExperimentRecord(String sessionId, Long recordId) {
        Optional<ExperimentRecord> opt = experimentRecordRepository.findById(recordId);
        if (opt.isPresent() && sessionId.equals(opt.get().getSessionId())) {
            experimentRecordRepository.delete(opt.get());
            return true;
        }
        return false;
    }
    
    public Optional<ExperimentRecordDTO> getExperimentRecord(String sessionId, Long recordId) {
        Optional<ExperimentRecord> opt = experimentRecordRepository.findById(recordId);
        if (opt.isPresent() && sessionId.equals(opt.get().getSessionId())) {
            return Optional.of(convertToRecordDTO(opt.get()));
        }
        return Optional.empty();
    }
    
    @Transactional
    public void cleanupExpiredData() {
        LocalDateTime now = LocalDateTime.now();
        customFormulaRepository.deleteByExpiresAtBefore(now);
        experimentRecordRepository.deleteByExpiresAtBefore(now);
        log.info("Cleaned up expired custom formulas and experiment records");
    }
    
    private Integer calculateFreshDays(CustomFormulaDTO dto) {
        double score = 5;
        
        if (dto.getSugarRatio() != null) {
            if (dto.getSugarRatio() >= 1.0 && dto.getSugarRatio() <= 3.0) {
                score += 3;
            } else if (dto.getSugarRatio() > 0) {
                score += 1.5;
            }
        }
        
        if (dto.getBleachRatio() != null && dto.getBleachRatio() > 0 && dto.getBleachRatio() <= 0.1) {
            score += 2.5;
        } else if (dto.getBleachRatio() != null && dto.getBleachRatio() > 0) {
            score += 1;
        }
        
        if (dto.getCitricAcidRatio() != null && dto.getCitricAcidRatio() > 0 && dto.getCitricAcidRatio() <= 0.2) {
            score += 1.5;
        }
        
        return (int) Math.max(5, Math.min(25, Math.round(score)));
    }
    
    private Integer calculateCost(CustomFormulaDTO dto) {
        int cost = 2;
        
        if (dto.getSugarRatio() != null && dto.getSugarRatio() > 0) cost += 1;
        if (dto.getBleachRatio() != null && dto.getBleachRatio() > 0) cost += 1;
        if (dto.getCitricAcidRatio() != null && dto.getCitricAcidRatio() > 0) cost += 1;
        if (dto.getOtherIngredients() != null && !dto.getOtherIngredients().trim().isEmpty()) cost += 1;
        
        return Math.max(1, Math.min(5, cost));
    }
    
    private Integer calculateEaseOfUse(CustomFormulaDTO dto) {
        int ease = 5;
        
        int ingredientCount = 0;
        if (dto.getSugarRatio() != null && dto.getSugarRatio() > 0) ingredientCount++;
        if (dto.getBleachRatio() != null && dto.getBleachRatio() > 0) ingredientCount++;
        if (dto.getCitricAcidRatio() != null && dto.getCitricAcidRatio() > 0) ingredientCount++;
        if (dto.getOtherIngredients() != null && !dto.getOtherIngredients().trim().isEmpty()) ingredientCount += 2;
        
        ease -= Math.max(0, ingredientCount - 2);
        
        return Math.max(1, Math.min(5, ease));
    }
    
    private CustomFormulaDTO convertToFormulaDTO(CustomFormula entity) {
        CustomFormulaDTO dto = new CustomFormulaDTO();
        dto.setId(entity.getId());
        dto.setFormulaCode(entity.getFormulaCode());
        dto.setFormulaName(entity.getFormulaName());
        dto.setSugarRatio(entity.getSugarRatio());
        dto.setBleachRatio(entity.getBleachRatio());
        dto.setCitricAcidRatio(entity.getCitricAcidRatio());
        dto.setOtherIngredients(entity.getOtherIngredients());
        dto.setFreshDays(entity.getFreshDays());
        dto.setCost(entity.getCost());
        dto.setEaseOfUse(entity.getEaseOfUse());
        dto.setDescription(entity.getDescription());
        return dto;
    }
    
    private ExperimentRecordDTO convertToRecordDTO(ExperimentRecord entity) {
        ExperimentRecordDTO dto = new ExperimentRecordDTO();
        dto.setId(entity.getId());
        dto.setFlowerType(entity.getFlowerType());
        dto.setExperimentDays(entity.getExperimentDays());
        dto.setFormulaAResult(entity.getFormulaAResult());
        dto.setFormulaAStatus(entity.getFormulaAStatus());
        dto.setFormulaBResult(entity.getFormulaBResult());
        dto.setFormulaBStatus(entity.getFormulaBStatus());
        dto.setFormulaCResult(entity.getFormulaCResult());
        dto.setFormulaCStatus(entity.getFormulaCStatus());
        dto.setFormulaDResult(entity.getFormulaDResult());
        dto.setFormulaDStatus(entity.getFormulaDStatus());
        dto.setFormulaDExists(entity.getFormulaDExists());
        dto.setFormulaDName(entity.getFormulaDName());
        dto.setRecommendedFormula(entity.getRecommendedFormula());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setNote(entity.getNote());
        return dto;
    }
}
