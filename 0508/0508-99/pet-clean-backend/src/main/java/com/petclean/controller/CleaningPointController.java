package com.petclean.controller;

import com.petclean.entity.CleaningPoint;
import com.petclean.service.CleaningPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cleaning-points")
@RequiredArgsConstructor
public class CleaningPointController {

    private final CleaningPointService cleaningPointService;

    @GetMapping
    public ResponseEntity<List<CleaningPoint>> getAllCleaningPoints() {
        return ResponseEntity.ok(cleaningPointService.getAllCleaningPoints());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CleaningPoint>> getCleaningPointsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(cleaningPointService.getCleaningPointsByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CleaningPoint> getCleaningPointById(@PathVariable Long id) {
        Optional<CleaningPoint> point = cleaningPointService.getCleaningPointById(id);
        return point.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/mark-pending")
    public ResponseEntity<CleaningPoint> markAsPending(@PathVariable Long id) {
        CleaningPoint point = cleaningPointService.markAsPending(id);
        return ResponseEntity.ok(point);
    }
}
