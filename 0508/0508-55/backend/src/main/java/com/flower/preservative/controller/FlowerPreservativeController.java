package com.flower.preservative.controller;

import com.flower.preservative.dto.FormulaComparisonDTO;
import com.flower.preservative.dto.FormulaRecommendationDTO;
import com.flower.preservative.dto.SimulationResultDTO;
import com.flower.preservative.service.FlowerPreservativeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class FlowerPreservativeController {
    
    private final FlowerPreservativeService preservativeService;
    
    @GetMapping("/flower-types")
    public ResponseEntity<Map<String, Object>> getFlowerTypes() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<String> flowerTypes = preservativeService.getAllFlowerTypes();
            response.put("success", true);
            response.put("data", flowerTypes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/formulas")
    public ResponseEntity<Map<String, Object>> getAllFormulas() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FormulaComparisonDTO> formulas = preservativeService.getAllFormulas();
            response.put("success", true);
            response.put("data", formulas);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations(@RequestParam String flowerType) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FormulaRecommendationDTO> recommendations = preservativeService.getRecommendations(flowerType);
            response.put("success", true);
            response.put("data", recommendations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/simulate")
    public ResponseEntity<Map<String, Object>> runSimulation(
            @RequestParam String flowerType,
            @RequestParam int experimentDays) {
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
            
            List<SimulationResultDTO> results = preservativeService.runSimulation(flowerType, experimentDays);
            response.put("success", true);
            response.put("data", results);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/radar-data")
    public ResponseEntity<Map<String, Object>> getRadarData(
            @RequestParam(required = false) String flowerType) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<FormulaComparisonDTO> formulas;
            if (flowerType != null && !flowerType.isEmpty()) {
                formulas = preservativeService.getFormulasForRadar(flowerType);
            } else {
                formulas = preservativeService.getAllFormulas();
            }
            response.put("success", true);
            response.put("data", formulas);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
