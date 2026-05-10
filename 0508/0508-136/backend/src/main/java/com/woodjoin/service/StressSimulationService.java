package com.woodjoin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.woodjoin.dto.JoinParamsDTO;
import com.woodjoin.enums.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StressSimulationService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final JoinCalculationService joinCalculationService;

    private static final double WOOD_MODULUS = 10000.0;
    private static final double WOOD_POISSON = 0.3;
    private static final double TENSILE_STRENGTH = 40.0;
    private static final double SHEAR_STRENGTH = 10.0;
    private static final double COMPRESSIVE_STRENGTH = 50.0;

    public Map<String, Object> simulateStress(JoinParamsDTO params, double loadForce, String loadDirection) {
        String cacheKey = "stress:" + generateCacheKey(params, loadForce, loadDirection);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, Map.class);
            } catch (Exception e) {
                log.warn("缓存解析失败", e);
            }
        }

        Map<String, Object> joinResult = joinCalculationService.calculateJoin(params);
        Map<String, Object> stressResult = calculateStressDistribution(params, joinResult, loadForce, loadDirection);
        
        try {
            String json = objectMapper.writeValueAsString(stressResult);
            redisTemplate.opsForValue().set(cacheKey, json, 30, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("缓存保存失败", e);
        }

        return stressResult;
    }

    private Map<String, Object> calculateStressDistribution(JoinParamsDTO params, 
                                                            Map<String, Object> joinResult,
                                                            double loadForce, 
                                                            String loadDirection) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        JoinType type = params.getJoinType();
        
        double maxStress = 0;
        double avgStress = 0;
        double safetyFactor = 1.0;
        String riskLevel = "LOW";
        String criticalRegion = "";
        
        List<Map<String, Object>> stressPoints = new ArrayList<>();
        
        switch (type) {
            case DOVETAIL:
                result.putAll(calculateDovetailStress(params, joinResult, loadForce, loadDirection));
                break;
            case STRAIGHT:
                result.putAll(calculateStraightStress(params, joinResult, loadForce, loadDirection));
                break;
            case CLAMP:
                result.putAll(calculateClampStress(params, joinResult, loadForce, loadDirection));
                break;
            case BOX:
                result.putAll(calculateBoxStress(params, joinResult, loadForce, loadDirection));
                break;
            case LAP:
                result.putAll(calculateLapStress(params, joinResult, loadForce, loadDirection));
                break;
        }
        
        maxStress = ((Number) result.getOrDefault("maxStress", 0)).doubleValue();
        avgStress = ((Number) result.getOrDefault("avgStress", 0)).doubleValue();
        safetyFactor = ((Number) result.getOrDefault("safetyFactor", 1.0)).doubleValue();
        riskLevel = (String) result.getOrDefault("riskLevel", "LOW");
        criticalRegion = (String) result.getOrDefault("criticalRegion", "");
        
        result.put("loadForce", loadForce);
        result.put("loadDirection", loadDirection);
        result.put("materialProperties", Map.of(
            "modulusOfElasticity", WOOD_MODULUS,
            "poissonsRatio", WOOD_POISSON,
            "tensileStrength", TENSILE_STRENGTH,
            "shearStrength", SHEAR_STRENGTH,
            "compressiveStrength", COMPRESSIVE_STRENGTH,
            "unit", "MPa"
        ));
        
        return result;
    }

    private Map<String, Object> calculateDovetailStress(JoinParamsDTO params, 
                                                         Map<String, Object> joinResult,
                                                         double loadForce, 
                                                         String loadDirection) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double tenonWidth = params.getTenonWidth();
        double tenonHeight = params.getTenonHeight();
        double tenonLength = params.getTenonLength();
        int tailCount = ((Number) joinResult.getOrDefault("tailCount", 1)).intValue();
        double tailWidth = ((Number) joinResult.getOrDefault("tailWidth", tenonWidth)).doubleValue();
        double tailAngle = ((Number) joinResult.getOrDefault("tailAngle", 75)).doubleValue();
        double tailOffset = ((Number) joinResult.getOrDefault("tailOffset", 0)).doubleValue();
        
        double shearArea = tailCount * tailWidth * tenonHeight;
        double compressiveArea = tailCount * 2 * tailOffset * tenonHeight;
        double tensileArea = tailCount * tailWidth * tenonHeight;
        
        double angleRad = Math.toRadians(tailAngle);
        double shearStress, compressiveStress, tensileStress;
        
        if ("TENSION".equals(loadDirection)) {
            shearStress = loadForce * Math.sin(angleRad) / shearArea;
            compressiveStress = loadForce * Math.cos(angleRad) / compressiveArea;
            tensileStress = loadForce / tensileArea;
        } else if ("COMPRESSION".equals(loadDirection)) {
            shearStress = loadForce * Math.sin(angleRad) / shearArea;
            compressiveStress = loadForce * Math.cos(angleRad) / (shearArea + compressiveArea);
            tensileStress = 0;
        } else if ("BENDING".equals(loadDirection)) {
            double bendingMoment = loadForce * tenonLength;
            double sectionModulus = tailCount * (tailWidth * tenonHeight * tenonHeight) / 6;
            shearStress = loadForce / shearArea;
            compressiveStress = bendingMoment / sectionModulus;
            tensileStress = bendingMoment / sectionModulus;
        } else {
            shearStress = loadForce / shearArea;
            compressiveStress = loadForce / compressiveArea;
            tensileStress = loadForce / tensileArea;
        }
        
        double maxStress = Math.max(Math.max(shearStress, compressiveStress), tensileStress);
        double avgStress = (shearStress + compressiveStress + tensileStress) / 3;
        
        double allowableStress = Math.min(SHEAR_STRENGTH, Math.min(COMPRESSIVE_STRENGTH, TENSILE_STRENGTH));
        double safetyFactor = allowableStress / (maxStress + 0.001);
        
        String riskLevel = safetyFactor > 3.0 ? "LOW" : (safetyFactor > 1.5 ? "MEDIUM" : "HIGH");
        String criticalRegion = "";
        
        if (shearStress > compressiveStress && shearStress > tensileStress) {
            criticalRegion = "燕尾斜面剪切应力最大";
        } else if (compressiveStress > tensileStress) {
            criticalRegion = "燕尾根部压应力最大";
        } else {
            criticalRegion = "榫头截面拉应力最大";
        }
        
        result.put("shearStress", shearStress);
        result.put("compressiveStress", compressiveStress);
        result.put("tensileStress", tensileStress);
        result.put("maxStress", maxStress);
        result.put("avgStress", avgStress);
        result.put("safetyFactor", safetyFactor);
        result.put("riskLevel", riskLevel);
        result.put("criticalRegion", criticalRegion);
        
        List<Map<String, Object>> stressZones = new ArrayList<>();
        
        double shearZoneFactor = shearStress / (maxStress + 0.001);
        double compressionZoneFactor = compressiveStress / (maxStress + 0.001);
        double tensionZoneFactor = tensileStress / (maxStress + 0.001);
        
        stressZones.add(Map.of(
            "name", "燕尾斜面剪切区",
            "stressLevel", shearZoneFactor,
            "stressValue", shearStress,
            "color", stressToColor(shearZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "燕尾根部承压区",
            "stressLevel", compressionZoneFactor,
            "stressValue", compressiveStress,
            "color", stressToColor(compressionZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "榫头截面受拉区",
            "stressLevel", tensionZoneFactor,
            "stressValue", tensileStress,
            "color", stressToColor(tensionZoneFactor)
        ));
        
        result.put("stressZones", stressZones);
        result.put("tailCount", tailCount);
        
        return result;
    }

    private Map<String, Object> calculateStraightStress(JoinParamsDTO params, 
                                                         Map<String, Object> joinResult,
                                                         double loadForce, 
                                                         String loadDirection) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double tenonWidth = params.getTenonWidth();
        double tenonHeight = params.getTenonHeight();
        double tenonLength = params.getTenonLength();
        
        double shearArea = tenonWidth * tenonHeight;
        double compressiveArea = tenonWidth * tenonHeight;
        double bendingArea = tenonWidth * tenonHeight * tenonHeight / 6;
        
        double shearStress, compressiveStress, tensileStress;
        
        if ("TENSION".equals(loadDirection)) {
            shearStress = loadForce / (2 * shearArea);
            compressiveStress = 0;
            tensileStress = loadForce / compressiveArea;
        } else if ("COMPRESSION".equals(loadDirection)) {
            shearStress = loadForce / (2 * shearArea);
            compressiveStress = loadForce / compressiveArea;
            tensileStress = 0;
        } else if ("BENDING".equals(loadDirection)) {
            double bendingMoment = loadForce * tenonLength;
            shearStress = 1.5 * loadForce / shearArea;
            compressiveStress = bendingMoment / bendingArea;
            tensileStress = bendingMoment / bendingArea;
        } else {
            shearStress = loadForce / shearArea;
            compressiveStress = loadForce / compressiveArea;
            tensileStress = loadForce / compressiveArea;
        }
        
        double maxStress = Math.max(Math.max(shearStress, compressiveStress), tensileStress);
        double avgStress = (shearStress + compressiveStress + tensileStress) / 3;
        
        double allowableStress = Math.min(SHEAR_STRENGTH, Math.min(COMPRESSIVE_STRENGTH, TENSILE_STRENGTH));
        double safetyFactor = allowableStress / (maxStress + 0.001);
        
        String riskLevel = safetyFactor > 3.0 ? "LOW" : (safetyFactor > 1.5 ? "MEDIUM" : "HIGH");
        String criticalRegion = "";
        
        if ("BENDING".equals(loadDirection)) {
            criticalRegion = "榫根弯曲应力最大";
        } else if (shearStress > maxStress * 0.8) {
            criticalRegion = "剪切面应力集中";
        } else {
            criticalRegion = "榫头端面应力最大";
        }
        
        result.put("shearStress", shearStress);
        result.put("compressiveStress", compressiveStress);
        result.put("tensileStress", tensileStress);
        result.put("maxStress", maxStress);
        result.put("avgStress", avgStress);
        result.put("safetyFactor", safetyFactor);
        result.put("riskLevel", riskLevel);
        result.put("criticalRegion", criticalRegion);
        
        List<Map<String, Object>> stressZones = new ArrayList<>();
        
        double shearZoneFactor = shearStress / (maxStress + 0.001);
        double compressionZoneFactor = compressiveStress / (maxStress + 0.001);
        double tensionZoneFactor = tensileStress / (maxStress + 0.001);
        
        stressZones.add(Map.of(
            "name", "剪切面",
            "stressLevel", shearZoneFactor,
            "stressValue", shearStress,
            "color", stressToColor(shearZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "端面承压区",
            "stressLevel", compressionZoneFactor,
            "stressValue", compressiveStress,
            "color", stressToColor(compressionZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "榫根弯曲区",
            "stressLevel", tensionZoneFactor,
            "stressValue", tensileStress,
            "color", stressToColor(tensionZoneFactor)
        ));
        
        result.put("stressZones", stressZones);
        
        return result;
    }

    private Map<String, Object> calculateClampStress(JoinParamsDTO params, 
                                                      Map<String, Object> joinResult,
                                                      double loadForce, 
                                                      String loadDirection) {
        Map<String, Object> baseResult = calculateStraightStress(params, joinResult, loadForce, loadDirection);
        
        double clampFactor = 1.3;
        double shearStress = ((Number) baseResult.get("shearStress")).doubleValue() * clampFactor;
        double compressiveStress = ((Number) baseResult.get("compressiveStress")).doubleValue();
        double tensileStress = ((Number) baseResult.get("tensileStress")).doubleValue() * 0.8;
        
        double maxStress = Math.max(Math.max(shearStress, compressiveStress), tensileStress);
        double avgStress = (shearStress + compressiveStress + tensileStress) / 3;
        
        double allowableStress = Math.min(SHEAR_STRENGTH, Math.min(COMPRESSIVE_STRENGTH, TENSILE_STRENGTH));
        double safetyFactor = allowableStress / (maxStress + 0.001);
        
        String riskLevel = safetyFactor > 3.0 ? "LOW" : (safetyFactor > 1.5 ? "MEDIUM" : "HIGH");
        
        baseResult.put("shearStress", shearStress);
        baseResult.put("tensileStress", tensileStress);
        baseResult.put("maxStress", maxStress);
        baseResult.put("avgStress", avgStress);
        baseResult.put("safetyFactor", safetyFactor);
        baseResult.put("riskLevel", riskLevel);
        baseResult.put("criticalRegion", "夹头肩部剪切应力集中");
        
        return baseResult;
    }

    private Map<String, Object> calculateBoxStress(JoinParamsDTO params, 
                                                    Map<String, Object> joinResult,
                                                    double loadForce, 
                                                    String loadDirection) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        int fingerCount = ((Number) joinResult.getOrDefault("fingerCount", 4)).intValue();
        double fingerWidth = ((Number) joinResult.getOrDefault("fingerWidth", params.getTenonWidth())).doubleValue();
        double tenonHeight = params.getTenonHeight();
        double tenonLength = params.getTenonLength();
        
        double totalShearArea = fingerCount * fingerWidth * tenonHeight;
        double shearStress = loadForce / totalShearArea;
        
        double fingerStress = loadForce / (fingerCount * fingerWidth * tenonHeight);
        double glueLineStress = loadForce / (fingerCount * fingerWidth * tenonLength * 0.5);
        
        double maxStress = Math.max(shearStress, Math.max(fingerStress, glueLineStress));
        double avgStress = (shearStress + fingerStress + glueLineStress) / 3;
        
        double allowableStress = SHEAR_STRENGTH * 0.7;
        double safetyFactor = allowableStress / (maxStress + 0.001);
        
        String riskLevel = safetyFactor > 3.0 ? "LOW" : (safetyFactor > 1.5 ? "MEDIUM" : "HIGH");
        String criticalRegion = "指接根部剪切应力最大";
        
        result.put("shearStress", shearStress);
        result.put("compressiveStress", fingerStress);
        result.put("tensileStress", glueLineStress);
        result.put("maxStress", maxStress);
        result.put("avgStress", avgStress);
        result.put("safetyFactor", safetyFactor);
        result.put("riskLevel", riskLevel);
        result.put("criticalRegion", criticalRegion);
        
        List<Map<String, Object>> stressZones = new ArrayList<>();
        
        double shearZoneFactor = shearStress / (maxStress + 0.001);
        double fingerZoneFactor = fingerStress / (maxStress + 0.001);
        double glueZoneFactor = glueLineStress / (maxStress + 0.001);
        
        stressZones.add(Map.of(
            "name", "指接剪切面",
            "stressLevel", shearZoneFactor,
            "stressValue", shearStress,
            "color", stressToColor(shearZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "指根应力集中",
            "stressLevel", fingerZoneFactor,
            "stressValue", fingerStress,
            "color", stressToColor(fingerZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "胶合面应力",
            "stressLevel", glueZoneFactor,
            "stressValue", glueLineStress,
            "color", stressToColor(glueZoneFactor)
        ));
        
        result.put("stressZones", stressZones);
        result.put("fingerCount", fingerCount);
        
        return result;
    }

    private Map<String, Object> calculateLapStress(JoinParamsDTO params, 
                                                    Map<String, Object> joinResult,
                                                    double loadForce, 
                                                    String loadDirection) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        double lapWidth = params.getWoodWidth() - 2 * params.getMargin();
        double lapHeight = params.getWoodHeight() / 2;
        double tenonLength = params.getTenonLength();
        
        double shearArea = lapWidth * tenonLength;
        double compressiveArea = lapWidth * lapHeight;
        
        double shearStress = loadForce / shearArea;
        double bearingStress = loadForce / compressiveArea;
        
        double bendingMoment = loadForce * tenonLength * 0.5;
        double sectionModulus = lapWidth * lapHeight * lapHeight / 6;
        double bendingStress = bendingMoment / sectionModulus;
        
        double maxStress = Math.max(shearStress, Math.max(bearingStress, bendingStress));
        double avgStress = (shearStress + bearingStress + bendingStress) / 3;
        
        double allowableShear = SHEAR_STRENGTH * 0.6;
        double allowableStress = Math.min(allowableShear, COMPRESSIVE_STRENGTH);
        double safetyFactor = allowableStress / (maxStress + 0.001);
        
        String riskLevel = safetyFactor > 3.0 ? "LOW" : (safetyFactor > 1.5 ? "MEDIUM" : "HIGH");
        String criticalRegion = "搭接面剪切应力最大";
        
        result.put("shearStress", shearStress);
        result.put("compressiveStress", bearingStress);
        result.put("tensileStress", bendingStress);
        result.put("maxStress", maxStress);
        result.put("avgStress", avgStress);
        result.put("safetyFactor", safetyFactor);
        result.put("riskLevel", riskLevel);
        result.put("criticalRegion", criticalRegion);
        
        List<Map<String, Object>> stressZones = new ArrayList<>();
        
        double shearZoneFactor = shearStress / (maxStress + 0.001);
        double bearingZoneFactor = bearingStress / (maxStress + 0.001);
        double bendingZoneFactor = bendingStress / (maxStress + 0.001);
        
        stressZones.add(Map.of(
            "name", "搭接剪切面",
            "stressLevel", shearZoneFactor,
            "stressValue", shearStress,
            "color", stressToColor(shearZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "端面承压区",
            "stressLevel", bearingZoneFactor,
            "stressValue", bearingStress,
            "color", stressToColor(bearingZoneFactor)
        ));
        
        stressZones.add(Map.of(
            "name", "搭接根部弯曲",
            "stressLevel", bendingZoneFactor,
            "stressValue", bendingStress,
            "color", stressToColor(bendingZoneFactor)
        ));
        
        result.put("stressZones", stressZones);
        
        return result;
    }

    private String stressToColor(double stressLevel) {
        stressLevel = Math.max(0, Math.min(1, stressLevel));
        
        int r, g, b;
        
        if (stressLevel < 0.25) {
            double t = stressLevel / 0.25;
            r = (int) (0);
            g = (int) (128 + 127 * t);
            b = (int) (255 - 127 * t);
        } else if (stressLevel < 0.5) {
            double t = (stressLevel - 0.25) / 0.25;
            r = (int) (0 + 127 * t);
            g = (int) (255);
            b = (int) (128 - 127 * t);
        } else if (stressLevel < 0.75) {
            double t = (stressLevel - 0.5) / 0.25;
            r = (int) (128 + 127 * t);
            g = (int) (255 - 127 * t);
            b = (int) (0);
        } else {
            double t = (stressLevel - 0.75) / 0.25;
            r = (int) (255);
            g = (int) (128 - 127 * t);
            b = (int) (0);
        }
        
        return String.format("#%02X%02X%02X", r, g, b);
    }

    private String generateCacheKey(JoinParamsDTO params, double loadForce, String loadDirection) {
        return String.format("stress:%s:%.2f:%.2f:%.2f:%.2f:%.2f:%.2f:%.2f:%.2f:%s",
                params.getJoinType(),
                params.getWoodLength(),
                params.getWoodWidth(),
                params.getWoodHeight(),
                params.getTenonLength(),
                params.getTenonWidth(),
                params.getTenonHeight(),
                params.getMargin(),
                loadForce,
                loadDirection);
    }
}