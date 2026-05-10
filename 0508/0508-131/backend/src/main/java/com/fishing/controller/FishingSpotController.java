package com.fishing.controller;

import com.fishing.common.Result;
import com.fishing.entity.FishingSpot;
import com.fishing.service.FishingSpotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/spots")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FishingSpotController {

    private final FishingSpotService fishingSpotService;

    @PostMapping
    public Result<FishingSpot> createSpot(@RequestBody FishingSpot spot) {
        FishingSpot saved = fishingSpotService.createSpot(spot);
        return Result.success("钓点创建成功", saved);
    }

    @GetMapping("/user/{userId}")
    public Result<List<FishingSpot>> getSpotsByUser(@PathVariable Long userId) {
        List<FishingSpot> spots = fishingSpotService.getSpotsByUser(userId);
        return Result.success(spots);
    }

    @GetMapping("/nearby")
    public Result<List<FishingSpot>> getNearbySpots(
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude,
            @RequestParam(defaultValue = "10") double radius) {
        List<FishingSpot> spots = fishingSpotService.getNearbySpots(latitude, longitude, radius);
        return Result.success(spots);
    }
}
