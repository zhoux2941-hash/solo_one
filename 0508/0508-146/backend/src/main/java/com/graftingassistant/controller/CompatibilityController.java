package com.graftingassistant.controller;

import com.graftingassistant.service.CompatibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/compatibility")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CompatibilityController {
    
    private final CompatibilityService compatibilityService;
    
    @GetMapping("/score")
    public ResponseEntity<Map<String, Object>> getCompatibilityScore(
            @RequestParam Long rootstockId,
            @RequestParam Long scionId) {
        
        Integer score = compatibilityService.getCompatibilityScore(rootstockId, scionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("rootstockId", rootstockId);
        response.put("scionId", scionId);
        response.put("score", score);
        
        String level;
        if (score >= 80) level = "极高";
        else if (score >= 60) level = "高";
        else if (score >= 40) level = "中等";
        else if (score >= 20) level = "低";
        else level = "极低";
        response.put("level", level);
        
        return ResponseEntity.ok(response);
    }
}
