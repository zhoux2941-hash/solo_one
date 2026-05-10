package com.biolab.pipette.controller;

import com.biolab.pipette.dto.ApiResponse;
import com.biolab.pipette.dto.PathOptimizationRequestDTO;
import com.biolab.pipette.dto.PathOptimizationResultDTO;
import com.biolab.pipette.dto.PipetteTaskDTO;
import com.biolab.pipette.service.PathOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/optimization")
@RequiredArgsConstructor
public class PathOptimizationController {

    private final PathOptimizationService pathOptimizationService;

    @PostMapping("/optimize")
    public ApiResponse<PathOptimizationResultDTO> optimizePath(
            @RequestBody PathOptimizationRequestDTO request) {
        PathOptimizationResultDTO result = pathOptimizationService.optimizePath(request);
        return ApiResponse.success("路径优化完成", result);
    }

    @PostMapping("/calculate-manual")
    public ApiResponse<Double> calculateManualDistance(
            @RequestParam(required = false) Integer startRow,
            @RequestParam(required = false) Integer startCol,
            @RequestBody List<PipetteTaskDTO> tasks) {
        double distance = pathOptimizationService.calculateManualDistance(tasks, startRow, startCol);
        return ApiResponse.success("手动路径距离计算完成", distance);
    }
}