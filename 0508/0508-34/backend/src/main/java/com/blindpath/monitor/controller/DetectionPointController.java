package com.blindpath.monitor.controller;

import com.blindpath.monitor.dto.DetectionPointDTO;
import com.blindpath.monitor.service.DetectionPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/detection-points")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class DetectionPointController {

    private final DetectionPointService detectionPointService;

    @GetMapping
    public ResponseEntity<List<DetectionPointDTO>> getDetectionPoints(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        List<DetectionPointDTO> points = detectionPointService.getDetectionPointsByDate(queryDate);
        return ResponseEntity.ok(points);
    }
}
