package com.lightpollution.controller;

import com.lightpollution.dto.ApiResponse;
import com.lightpollution.dto.BoundingBoxRequest;
import com.lightpollution.dto.ObservationRequest;
import com.lightpollution.entity.Observation;
import com.lightpollution.security.JwtTokenProvider;
import com.lightpollution.service.ObservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/observations")
@Validated
public class ObservationController {

    @Autowired
    private ObservationService observationService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createObservation(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ObservationRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            Observation observation = observationService.createObservation(userId, request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", observation.getId());
            result.put("latitude", observation.getLatitude());
            result.put("longitude", observation.getLongitude());
            result.put("magnitude", observation.getMagnitude());
            result.put("createdAt", observation.getCreatedAt());
            
            return ResponseEntity.ok(ApiResponse.success("观测记录已提交", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Observation>>> getMyObservations(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        List<Observation> observations = observationService.getUserObservations(userId);
        return ResponseEntity.ok(ApiResponse.success(observations));
    }

    @PostMapping("/public/by-bbox")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getObservationsByBoundingBox(
            @Valid @RequestBody BoundingBoxRequest request) {
        List<Map<String, Object>> observations = observationService.getObservationsByBoundingBox(
                request.getMinLat(), request.getMaxLat(),
                request.getMinLng(), request.getMaxLng()
        );
        return ResponseEntity.ok(ApiResponse.success(observations));
    }

    @PostMapping("/public/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAreaStats(
            @Valid @RequestBody BoundingBoxRequest request) {
        Map<String, Object> stats = observationService.getAreaStats(
                request.getMinLat(), request.getMaxLat(),
                request.getMinLng(), request.getMaxLng()
        );
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/public/location/{locationId}/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLocationHistory(
            @PathVariable Long locationId) {
        try {
            List<Map<String, Object>> history = observationService.getLocationHistory(locationId);
            return ResponseEntity.ok(ApiResponse.success(history));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("未授权");
    }
}
