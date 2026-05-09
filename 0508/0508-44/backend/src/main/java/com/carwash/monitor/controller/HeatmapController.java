package com.carwash.monitor.controller;

import com.carwash.monitor.dto.HeatmapDataDTO;
import com.carwash.monitor.dto.Result;
import com.carwash.monitor.service.HeatmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/heatmap")
@RequiredArgsConstructor
public class HeatmapController {

    private final HeatmapService heatmapService;

    @GetMapping("/last24")
    public Result<HeatmapDataDTO> getLast24HoursHeatmap() {
        HeatmapDataDTO data = heatmapService.getLast24HoursHeatmap();
        return Result.success(data);
    }

    @PostMapping("/cache/evict")
    public Result<String> evictCache() {
        heatmapService.evictCache();
        return Result.success("Cache evicted successfully");
    }
}
