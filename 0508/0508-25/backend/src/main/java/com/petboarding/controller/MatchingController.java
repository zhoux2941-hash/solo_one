package com.petboarding.controller;

import com.petboarding.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {
    
    private final MatchingService matchingService;
    
    @GetMapping("/recommend")
    public ResponseEntity<List<MatchingService.RoomRecommendation>> getRecommendations(
            @RequestParam Long petId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<MatchingService.RoomRecommendation> recommendations = 
                matchingService.findBestRooms(petId, startDate, endDate);
        
        return ResponseEntity.ok(recommendations);
    }
}
