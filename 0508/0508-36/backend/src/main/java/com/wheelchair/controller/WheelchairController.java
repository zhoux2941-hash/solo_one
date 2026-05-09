package com.wheelchair.controller;

import com.wheelchair.dto.WearDataResponse;
import com.wheelchair.dto.WearPredictionResponse;
import com.wheelchair.dto.YearOverYearResponse;
import com.wheelchair.service.WearPredictionService;
import com.wheelchair.service.WheelchairWearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wheelchairs")
@RequiredArgsConstructor
public class WheelchairController {

    private final WheelchairWearService wheelchairWearService;
    private final WearPredictionService wearPredictionService;

    @GetMapping("/wear")
    public ResponseEntity<List<WearDataResponse>> getCurrentWear() {
        List<WearDataResponse> wearData = wheelchairWearService.getCurrentWearData();
        return ResponseEntity.ok(wearData);
    }

    @GetMapping("/year-over-year")
    public ResponseEntity<List<YearOverYearResponse>> getYearOverYear() {
        List<YearOverYearResponse> yoYData = wheelchairWearService.getYearOverYearData();
        return ResponseEntity.ok(yoYData);
    }

    @GetMapping("/{wheelchairId}/prediction")
    public ResponseEntity<WearPredictionResponse> getWearPrediction(
            @PathVariable String wheelchairId) {
        WearPredictionResponse prediction = wearPredictionService.predictWear(wheelchairId);
        return ResponseEntity.ok(prediction);
    }
}
