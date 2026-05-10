package com.flower.preservative.service;

import com.flower.preservative.dto.FormulaComparisonDTO;
import com.flower.preservative.dto.FormulaRecommendationDTO;
import com.flower.preservative.dto.SimulationResultDTO;
import com.flower.preservative.entity.Flower;
import com.flower.preservative.entity.FlowerFormulaMapping;
import com.flower.preservative.entity.Formula;
import com.flower.preservative.repository.FlowerFormulaMappingRepository;
import com.flower.preservative.repository.FlowerRepository;
import com.flower.preservative.repository.FormulaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class FlowerPreservativeService {
    
    private final FormulaRepository formulaRepository;
    private final FlowerRepository flowerRepository;
    private final FlowerFormulaMappingRepository mappingRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    
    private static final String SIMULATION_CACHE_PREFIX = "simulation:";
    private static final long CACHE_EXPIRE_HOURS = 24;
    
    public List<FormulaComparisonDTO> getAllFormulas() {
        return formulaRepository.findAll().stream()
                .map(this::convertToComparisonDTO)
                .collect(Collectors.toList());
    }
    
    public List<FormulaRecommendationDTO> getRecommendations(String flowerType) {
        Optional<Flower> flowerOpt = flowerRepository.findByFlowerType(flowerType);
        if (flowerOpt.isEmpty()) {
            flowerOpt = flowerRepository.findByFlowerType("通用");
        }
        
        Flower flower = flowerOpt.orElseThrow(() -> new RuntimeException("未找到该鲜花类型"));
        
        List<FlowerFormulaMapping> mappings = mappingRepository.findByFlowerType(flower.getFlowerType());
        if (mappings.isEmpty()) {
            mappings = mappingRepository.findByFlowerType("通用");
        }
        
        List<FormulaRecommendationDTO> recommendations = new ArrayList<>();
        
        for (FlowerFormulaMapping mapping : mappings) {
            Optional<Formula> formulaOpt = formulaRepository.findByFormulaCode(mapping.getFormulaCode());
            if (formulaOpt.isPresent()) {
                Formula formula = formulaOpt.get();
                FormulaRecommendationDTO dto = new FormulaRecommendationDTO();
                dto.setFormulaCode(formula.getFormulaCode());
                dto.setFormulaName(formula.getFormulaName());
                dto.setFreshDays(formula.getFreshDays());
                dto.setCost(formula.getCost());
                dto.setEaseOfUse(formula.getEaseOfUse());
                dto.setLifespanExtensionDays(mapping.getLifespanExtensionDays());
                dto.setIsRecommended(mapping.getIsRecommended());
                recommendations.add(dto);
            }
        }
        
        return recommendations;
    }
    
    public List<SimulationResultDTO> runSimulation(String flowerType, int experimentDays) {
        String cacheKey = SIMULATION_CACHE_PREFIX + flowerType + ":" + experimentDays;
        
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                String json = objectMapper.writeValueAsString(cached);
                return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, SimulationResultDTO.class));
            }
        } catch (JsonProcessingException e) {
            log.warn("Redis cache deserialization failed", e);
        }
        
        List<FormulaRecommendationDTO> recommendations = getRecommendations(flowerType);
        List<SimulationResultDTO> results = new ArrayList<>();
        
        for (FormulaRecommendationDTO rec : recommendations) {
            int maxDays = rec.getLifespanExtensionDays();
            double witheringPercentage;
            String status;
            
            if (experimentDays <= 0 || maxDays <= 0) {
                witheringPercentage = 0.0;
                status = "新鲜";
            } else {
                witheringPercentage = Math.min(100.0, (double) experimentDays / maxDays * 100.0);
                witheringPercentage = Math.round(witheringPercentage * 100.0) / 100.0;
                
                if (witheringPercentage < 20) {
                    status = "新鲜";
                } else if (witheringPercentage < 50) {
                    status = "良好";
                } else if (witheringPercentage < 80) {
                    status = "逐渐枯萎";
                } else {
                    status = "枯萎严重";
                }
            }
            
            SimulationResultDTO result = new SimulationResultDTO();
            result.setFormulaCode(rec.getFormulaCode());
            result.setFormulaName(rec.getFormulaName());
            result.setExperimentDays(experimentDays);
            result.setWitheringPercentage(witheringPercentage);
            result.setStatus(status);
            results.add(result);
        }
        
        try {
            redisTemplate.opsForValue().set(cacheKey, results, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Redis cache write failed", e);
        }
        
        return results;
    }
    
    public List<FormulaComparisonDTO> getFormulasForRadar(String flowerType) {
        List<FormulaRecommendationDTO> recommendations = getRecommendations(flowerType);
        List<FormulaComparisonDTO> radarData = new ArrayList<>();
        
        for (FormulaRecommendationDTO rec : recommendations) {
            FormulaComparisonDTO dto = new FormulaComparisonDTO();
            dto.setFormulaCode(rec.getFormulaCode());
            dto.setFormulaName(rec.getFormulaName());
            dto.setFreshDays(rec.getLifespanExtensionDays());
            dto.setCost(rec.getCost());
            dto.setEaseOfUse(rec.getEaseOfUse());
            radarData.add(dto);
        }
        
        return radarData;
    }
    
    public List<String> getAllFlowerTypes() {
        return flowerRepository.findAll().stream()
                .map(Flower::getFlowerType)
                .filter(type -> !"通用".equals(type))
                .collect(Collectors.toList());
    }
    
    private FormulaComparisonDTO convertToComparisonDTO(Formula formula) {
        return new FormulaComparisonDTO(
                formula.getFormulaCode(),
                formula.getFormulaName(),
                formula.getFreshDays(),
                formula.getCost(),
                formula.getEaseOfUse()
        );
    }
}
