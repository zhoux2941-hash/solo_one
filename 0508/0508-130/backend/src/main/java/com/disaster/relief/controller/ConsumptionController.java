package com.disaster.relief.controller;

import com.disaster.relief.common.Result;
import com.disaster.relief.dto.AllocationResult;
import com.disaster.relief.dto.ConsumptionRequest;
import com.disaster.relief.dto.ConsumptionResult;
import com.disaster.relief.service.ConsumptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/consumption")
@RequiredArgsConstructor
public class ConsumptionController {

    private final ConsumptionService consumptionService;

    @PostMapping("/simulate")
    public Result<ConsumptionResult> simulateConsumption(@RequestBody ConsumptionRequest request) {
        ConsumptionResult result = consumptionService.simulate(request);
        return Result.success(result);
    }

    @PostMapping("/compare")
    public Result<Map<String, Object>> comparePlans(@RequestBody List<AllocationResult> plans) {
        Map<String, Object> comparison = consumptionService.comparePlans(plans);
        return Result.success(comparison);
    }
}
