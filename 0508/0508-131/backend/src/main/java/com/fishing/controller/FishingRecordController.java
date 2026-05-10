package com.fishing.controller;

import com.fishing.common.Result;
import com.fishing.dto.FishingRecordDTO;
import com.fishing.dto.HeatmapDataDTO;
import com.fishing.dto.LureRecommendationDTO;
import com.fishing.entity.FishSpecies;
import com.fishing.entity.FishingRecord;
import com.fishing.entity.Lure;
import com.fishing.service.FishingRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FishingRecordController {

    private final FishingRecordService fishingRecordService;

    @PostMapping
    public Result<FishingRecord> createRecord(@Valid @RequestBody FishingRecordDTO dto) {
        FishingRecord record = fishingRecordService.createRecord(dto);
        return Result.success("记录创建成功", record);
    }

    @GetMapping("/user/{userId}")
    public Result<List<FishingRecord>> getRecordsByUser(@PathVariable Long userId) {
        List<FishingRecord> records = fishingRecordService.getRecordsByUser(userId);
        return Result.success(records);
    }

    @GetMapping("/recommendations")
    public Result<List<LureRecommendationDTO>> getLureRecommendations(
            @RequestParam BigDecimal waterTemp,
            @RequestParam BigDecimal airTemp,
            @RequestParam(required = false) Long speciesId) {
        List<LureRecommendationDTO> recommendations = 
            fishingRecordService.getLureRecommendations(waterTemp, airTemp, speciesId);
        return Result.success(recommendations);
    }

    @GetMapping("/heatmap")
    public Result<List<HeatmapDataDTO>> getHeatmap() {
        List<HeatmapDataDTO> heatmap = fishingRecordService.getMonthlySpeciesHeatmap();
        return Result.success(heatmap);
    }

    @GetMapping("/species")
    public Result<List<FishSpecies>> getAllSpecies() {
        List<FishSpecies> species = fishingRecordService.getAllFishSpecies();
        return Result.success(species);
    }

    @GetMapping("/lures")
    public Result<List<Lure>> getAllLures() {
        List<Lure> lures = fishingRecordService.getAllLures();
        return Result.success(lures);
    }
}
