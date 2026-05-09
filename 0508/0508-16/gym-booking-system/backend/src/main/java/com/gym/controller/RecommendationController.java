package com.gym.controller;

import com.gym.dto.RecommendationDTO;
import com.gym.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {
    
    @Autowired
    private RecommendationService recommendationService;
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RecommendationDTO>> getRecommendations(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "6") int limit) {
        
        List<RecommendationDTO> recommendations = recommendationService.getRecommendations(userId, limit);
        return ResponseEntity.ok(recommendations);
    }
}
