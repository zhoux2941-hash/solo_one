package com.disaster.relief.controller;

import com.disaster.relief.common.Result;
import com.disaster.relief.dto.ForecastRequest;
import com.disaster.relief.dto.ForecastResponse;
import com.disaster.relief.entity.SupplyForecast;
import com.disaster.relief.service.ForecastService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @PostMapping("/calculate")
    public Result<ForecastResponse> calculateForecast(@Valid @RequestBody ForecastRequest request) {
        ForecastResponse response = forecastService.calculateForecast(request);
        return Result.success(response);
    }

    @GetMapping("/history")
    public Result<List<SupplyForecast>> getHistory(@RequestParam(required = false) String disasterType) {
        return Result.success(forecastService.getHistory(disasterType));
    }
}
