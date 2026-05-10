package com.aquarium.phmonitor.controller;

import com.aquarium.phmonitor.dto.ApiResponse;
import com.aquarium.phmonitor.dto.TankPhData;
import com.aquarium.phmonitor.service.PhRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ph")
public class PhMonitorController {

    @Autowired
    private PhRecordService phRecordService;

    @GetMapping("/tanks")
    public ApiResponse<List<String>> getAllTanks() {
        return ApiResponse.success(phRecordService.getAllTankNames());
    }

    @GetMapping("/dashboard")
    public ApiResponse<List<TankPhData>> getDashboardData() {
        return ApiResponse.success(phRecordService.getAllTanksLast24Hours());
    }

    @GetMapping("/tank/{tankName}")
    public ApiResponse<TankPhData> getTankDataByTimeRange(
        @PathVariable String tankName,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        return ApiResponse.success(phRecordService.getTankDataByTimeRange(tankName, startTime, endTime));
    }

    @GetMapping("/range")
    public ApiResponse<List<TankPhData>> getAllTanksByTimeRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        return ApiResponse.success(phRecordService.getAllTanksByTimeRange(startTime, endTime));
    }

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("phMin", 7.8);
        config.put("phMax", 8.4);
        config.put("tanks", phRecordService.getAllTankNames());
        return ApiResponse.success(config);
    }
}
