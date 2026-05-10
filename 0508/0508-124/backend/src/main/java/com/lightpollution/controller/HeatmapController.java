package com.lightpollution.controller;

import com.lightpollution.dto.ApiResponse;
import com.lightpollution.dto.BoundingBoxRequest;
import com.lightpollution.service.KrigingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/heatmap")
@Validated
public class HeatmapController {

    @Autowired
    private KrigingService krigingService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateHeatmap(
            @Valid @RequestBody BoundingBoxRequest request) {
        Map<String, Object> result = krigingService.generateHeatmap(
                request.getMinLat(), request.getMaxLat(),
                request.getMinLng(), request.getMaxLng()
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/contour")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateContourMap(
            @Valid @RequestBody BoundingBoxRequest request) {
        Map<String, Object> result = krigingService.generateContourMap(
                request.getMinLat(), request.getMaxLat(),
                request.getMinLng(), request.getMaxLng()
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
