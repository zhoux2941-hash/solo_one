package com.lightpollution.controller;

import com.lightpollution.dto.ApiResponse;
import com.lightpollution.service.AstronomyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/astronomy")
@Validated
public class AstronomyController {

    @Autowired
    private AstronomyService astronomyService;

    @GetMapping("/prediction")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPrediction(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double longitude) {

        try {
            List<Map<String, Object>> predictions = astronomyService.getThreeNightPrediction(latitude, longitude);
            return ResponseEntity.ok(ApiResponse.success(predictions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("计算预测失败: " + e.getMessage()));
        }
    }
}
