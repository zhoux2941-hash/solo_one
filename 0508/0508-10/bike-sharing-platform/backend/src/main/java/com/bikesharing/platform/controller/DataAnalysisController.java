package com.bikesharing.platform.controller;

import com.bikesharing.platform.dto.HourlyDemandDTO;
import com.bikesharing.platform.service.DataAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class DataAnalysisController {

    private final DataAnalysisService dataAnalysisService;

    @GetMapping("/hourly-demand")
    public ResponseEntity<List<HourlyDemandDTO>> getPastWeekHourlyDemand() {
        List<HourlyDemandDTO> demands = dataAnalysisService.getPastWeekHourlyDemand();
        return ResponseEntity.ok(demands);
    }
}
