package com.flower.preservative.controller;

import com.flower.preservative.dto.*;
import com.flower.preservative.service.CustomDataService;
import com.flower.preservative.service.FlowerPreservativeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CustomDataController {
    
    private final CustomDataService customDataService;
    private final FlowerPreservativeService preservativeService;
    
    private String getSessionIdFromHeader(String sessionIdHeader, String sessionIdParam) {
        if (sessionIdParam != null && !sessionIdParam.isEmpty()) {
            return sessionIdParam;
        }
        if (sessionIdHeader != null && !sessionIdHeader.isEmpty()) {
            return sessionIdHeader;
        }
        return UUID.randomUUID().toString().replace("-", "");
    }
    
    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> getOrCreateSession(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        String newSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
        response.put("success", true);
        response.put("sessionId", newSessionId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/custom-formula")
    public ResponseEntity<Map<String, Object>> saveCustomFormula(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId,
            @RequestBody CustomFormulaDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            CustomFormulaDTO saved = customDataService.saveCustomFormula(validSessionId, dto);
            response.put("success", true);
            response.put("data", saved);
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/custom-formula")
    public ResponseEntity<Map<String, Object>> getCustomFormula(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            Optional<CustomFormulaDTO> opt = customDataService.getCustomFormula(validSessionId);
            response.put("success", true);
            response.put("data", opt.orElse(null));
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/custom-formula")
    public ResponseEntity<Map<String, Object>> deleteCustomFormula(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            boolean deleted = customDataService.deleteCustomFormula(validSessionId);
            response.put("success", deleted);
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/radar-data-v2")
    public ResponseEntity<Map<String, Object>> getRadarDataV2(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String flowerType) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            
            List<FormulaComparisonDTO> formulas;
            if (flowerType != null && !flowerType.isEmpty()) {
                formulas = preservativeService.getFormulasForRadar(flowerType);
            } else {
                formulas = preservativeService.getAllFormulas();
            }
            
            FormulaComparisonDTO customFormula = customDataService.getCustomFormulaForRadar(validSessionId);
            if (customFormula != null) {
                formulas.add(customFormula);
            }
            
            response.put("success", true);
            response.put("data", formulas);
            response.put("sessionId", validSessionId);
            response.put("hasCustomFormula", customFormula != null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/simulate-v2")
    public ResponseEntity<Map<String, Object>> runSimulationV2(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId,
            @RequestParam String flowerType,
            @RequestParam int experimentDays,
            @RequestParam(required = false) String note) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (experimentDays < 0) {
                response.put("success", false);
                response.put("message", "实验天数不能为负数");
                return ResponseEntity.badRequest().body(response);
            }
            if (experimentDays > 60) {
                response.put("success", false);
                response.put("message", "实验天数不能超过60天");
                return ResponseEntity.badRequest().body(response);
            }
            
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            
            List<SimulationResultDTO> baseResults = preservativeService.runSimulation(flowerType, experimentDays);
            List<SimulationResultDTO> allResults = new ArrayList<>(baseResults);
            
            FormulaComparisonDTO customFormula = customDataService.getCustomFormulaForRadar(validSessionId);
            if (customFormula != null) {
                int maxDays = customFormula.getFreshDays();
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
                
                SimulationResultDTO customResult = new SimulationResultDTO();
                customResult.setFormulaCode(customFormula.getFormulaCode());
                customResult.setFormulaName(customFormula.getFormulaName());
                customResult.setExperimentDays(experimentDays);
                customResult.setWitheringPercentage(witheringPercentage);
                customResult.setStatus(status);
                allResults.add(customResult);
            }
            
            SimulationResultDTO best = allResults.stream()
                    .min(Comparator.comparingDouble(SimulationResultDTO::getWitheringPercentage))
                    .orElse(null);
            
            String recommendedFormula = best != null ? best.getFormulaCode() : null;
            
            ExperimentRecordDTO record = customDataService.saveExperimentRecord(
                    validSessionId,
                    flowerType,
                    experimentDays,
                    allResults,
                    recommendedFormula,
                    note
            );
            
            response.put("success", true);
            response.put("data", allResults);
            response.put("recommendedFormula", recommendedFormula);
            response.put("bestResult", best != null ? best.getWitheringPercentage() : null);
            response.put("recordId", record.getId());
            response.put("sessionId", validSessionId);
            response.put("hasCustomFormula", customFormula != null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/experiment-records")
    public ResponseEntity<Map<String, Object>> getExperimentRecords(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            List<ExperimentRecordDTO> records = customDataService.getExperimentRecords(validSessionId);
            response.put("success", true);
            response.put("data", records);
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/experiment-records/{id}")
    public ResponseEntity<Map<String, Object>> getExperimentRecord(
            @PathVariable Long id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            Optional<ExperimentRecordDTO> opt = customDataService.getExperimentRecord(validSessionId, id);
            if (opt.isPresent()) {
                response.put("success", true);
                response.put("data", opt.get());
            } else {
                response.put("success", false);
                response.put("message", "记录不存在或无权访问");
            }
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/experiment-records/{id}")
    public ResponseEntity<Map<String, Object>> deleteExperimentRecord(
            @PathVariable Long id,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionIdHeader,
            @RequestParam(required = false) String sessionId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String validSessionId = getSessionIdFromHeader(sessionIdHeader, sessionId);
            boolean deleted = customDataService.deleteExperimentRecord(validSessionId, id);
            response.put("success", deleted);
            response.put("sessionId", validSessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
