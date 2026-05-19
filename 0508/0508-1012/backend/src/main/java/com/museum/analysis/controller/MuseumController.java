package com.museum.analysis.controller;

import com.museum.analysis.model.*;
import com.museum.analysis.service.MuseumDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/museum")
@CrossOrigin(origins = "*")
public class MuseumController {

    private final MuseumDataService dataService;

    public MuseumController(MuseumDataService dataService) {
        this.dataService = dataService;
    }

    @GetMapping("/exhibits")
    public ResponseEntity<List<Exhibit>> getExhibits() {
        return ResponseEntity.ok(dataService.getAllExhibits());
    }

    @GetMapping("/visitor-flow")
    public ResponseEntity<List<VisitorFlow>> getVisitorFlow(@RequestParam(defaultValue = "60") int minutes) {
        return ResponseEntity.ok(dataService.getVisitorFlows(minutes));
    }

    @GetMapping("/heat-ranking")
    public ResponseEntity<List<ExhibitHeat>> getHeatRanking() {
        return ResponseEntity.ok(dataService.getExhibitHeatRanking());
    }

    @GetMapping("/heatmap")
    public ResponseEntity<List<HeatMapPoint>> getHeatMap() {
        return ResponseEntity.ok(dataService.getHeatMapData());
    }

    @GetMapping("/realtime-stats")
    public ResponseEntity<Map<String, Object>> getRealtimeStats() {
        Map<String, Object> result = new HashMap<>();
        result.putAll(dataService.getRealtimeStats());
        result.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("exhibitCount", dataService.getAllExhibits().size());
        summary.put("heatRanking", dataService.getExhibitHeatRanking());
        summary.put("realtime", dataService.getRealtimeStats());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/positioning-info")
    public ResponseEntity<Map<String, Object>> getPositioningInfo() {
        return ResponseEntity.ok(dataService.getPositioningInfo());
    }

    @GetMapping("/gaze-info")
    public ResponseEntity<Map<String, Object>> getGazeInfo() {
        return ResponseEntity.ok(dataService.getGazeInfo());
    }
}
