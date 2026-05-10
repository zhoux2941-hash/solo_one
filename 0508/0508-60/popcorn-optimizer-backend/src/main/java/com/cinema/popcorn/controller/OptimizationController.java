package com.cinema.popcorn.controller;

import com.cinema.popcorn.config.PopcornProperties;
import com.cinema.popcorn.dto.OptimizationRequest;
import com.cinema.popcorn.dto.OptimizationResponse;
import com.cinema.popcorn.service.QueueTheoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/optimize")
@RequiredArgsConstructor
public class OptimizationController {

    private final QueueTheoryService queueTheoryService;
    private final PopcornProperties properties;

    @PostMapping
    public ResponseEntity<OptimizationResponse> optimize(@Valid @RequestBody OptimizationRequest request) {
        log.info("收到优化请求: expectedPassengers={}, date={}, isHoliday={}", 
                request.getExpectedPassengers(), request.getDate(), request.getIsHoliday());
        
        if (request.getIsHoliday() == null) {
            request.setIsHoliday(false);
        }

        OptimizationResponse response = queueTheoryService.optimizeScheduling(request);
        log.info("优化计算完成: 使用机器数={}, 平均等待时间={}", 
                response.getTotalMachinesUsed(), response.getAvgWaitingTime());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("totalMachines", properties.getTotalMachines());
        config.put("warmupMinutes", properties.getWarmupMinutes());
        config.put("peakStartHour", properties.getPeakStartHour());
        config.put("peakEndHour", properties.getPeakEndHour());
        config.put("maxQueueLength", properties.getMaxQueueLength());
        config.put("serviceRatePerMachine", properties.getServiceRatePerMachine());
        return ResponseEntity.ok(config);
    }
}
