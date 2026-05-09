package com.carwash.monitor.controller;

import com.carwash.monitor.dto.AbnormalStatsDTO;
import com.carwash.monitor.dto.Result;
import com.carwash.monitor.entity.FoamConcentration;
import com.carwash.monitor.service.FoamConcentrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foam")
@RequiredArgsConstructor
public class FoamConcentrationController {

    private final FoamConcentrationService service;

    @GetMapping("/history")
    public Result<List<FoamConcentration>> getHistory(
            @RequestParam(required = false) String machineId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {

        List<FoamConcentration> data = service.findByConditions(machineId, startTime, endTime);
        return Result.success(data);
    }

    @GetMapping("/grouped")
    public Result<Map<String, List<FoamConcentration>>> getLast24HoursGrouped() {
        Map<String, List<FoamConcentration>> data = service.getLast24HoursGrouped();
        return Result.success(data);
    }

    @GetMapping("/stats")
    public Result<List<AbnormalStatsDTO>> getAbnormalStats(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {

        List<AbnormalStatsDTO> data = service.getAbnormalStats(startTime, endTime);
        return Result.success(data);
    }

    @PostMapping("/mock/generate")
    public Result<String> generateMockData() {
        service.generateMockData();
        return Result.success("Mock data generated successfully");
    }
}
