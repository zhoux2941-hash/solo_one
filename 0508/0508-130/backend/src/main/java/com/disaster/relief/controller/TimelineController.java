package com.disaster.relief.controller;

import com.disaster.relief.common.Result;
import com.disaster.relief.dto.*;
import com.disaster.relief.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @PostMapping("/generate")
    public Result<TimelineAnimationResult> generateTimeline(@RequestBody TimelineAnimationRequest request) {
        TimelineAnimationResult result = timelineService.generateTimeline(request);
        return Result.success(result);
    }

    @GetMapping("/demo")
    public Result<TimelineAnimationResult> getDemoTimeline() {
        TimelineAnimationRequest request = new TimelineAnimationRequest();
        request.setAffectedPopulation(50000);
        request.setSimulationDays(30);
        request.setConsumptionRateMultiplier(1.0);
        request.setInitialStock(SupplyRequirement.builder()
            .tentQuantity(5000)
            .waterQuantity(500000)
            .foodQuantity(300000)
            .medicalKitQuantity(3000)
            .build());
        request.setScheduledDeliveries(List.of(
            SupplyDelivery.builder()
                .day(10)
                .supplies(SupplyRequirement.builder()
                    .tentQuantity(2000)
                    .waterQuantity(200000)
                    .foodQuantity(150000)
                    .medicalKitQuantity(1500)
                    .build())
                .source("省级应急物资储备中心")
                .build(),
            SupplyDelivery.builder()
                .day(20)
                .supplies(SupplyRequirement.builder()
                    .tentQuantity(1500)
                    .waterQuantity(150000)
                    .foodQuantity(100000)
                    .medicalKitQuantity(1000)
                    .build())
                .source("周边地市支援")
                .build()
        ));
        
        TimelineAnimationResult result = timelineService.generateTimeline(request);
        return Result.success(result);
    }
}
