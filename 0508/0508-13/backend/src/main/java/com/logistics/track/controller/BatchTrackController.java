package com.logistics.track.controller;

import com.logistics.track.dto.RouteAggregationDTO;
import com.logistics.track.dto.TrackSummaryDTO;
import com.logistics.track.service.BatchTrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
public class BatchTrackController {

    private final BatchTrackService batchTrackService;

    @PostMapping("/tracks/summary")
    public ResponseEntity<List<TrackSummaryDTO>> getBatchTrackSummary(@RequestBody List<Long> packageIds) {
        return ResponseEntity.ok(batchTrackService.getBatchTrackSummary(packageIds));
    }

    @GetMapping("/tracks/all-summary")
    public ResponseEntity<List<TrackSummaryDTO>> getAllTrackSummaries() {
        return ResponseEntity.ok(batchTrackService.getAllTrackSummaries());
    }

    @GetMapping("/routes/aggregation")
    public ResponseEntity<List<RouteAggregationDTO>> getRouteAggregation() {
        return ResponseEntity.ok(batchTrackService.getRouteAggregation());
    }

    @GetMapping("/routes/aggregation/refresh")
    public ResponseEntity<List<RouteAggregationDTO>> refreshRouteAggregation() {
        batchTrackService.invalidateRouteCache();
        return ResponseEntity.ok(batchTrackService.getRouteAggregation());
    }
}
