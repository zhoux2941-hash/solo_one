package com.beekeeper.controller;

import com.beekeeper.dto.ComparisonDataDTO;
import com.beekeeper.service.ComparisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/comparison")
@RequiredArgsConstructor
public class ComparisonController {
    
    private final ComparisonService comparisonService;
    
    @GetMapping
    public ResponseEntity<ComparisonDataDTO> getComparisonData(
            @RequestParam List<Long> beehiveIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        ComparisonDataDTO data;
        if (startDate != null && endDate != null) {
            data = comparisonService.getComparisonData(beehiveIds, startDate, endDate);
        } else {
            data = comparisonService.getDefaultComparisonData(beehiveIds);
        }
        
        return ResponseEntity.ok(data);
    }
}
