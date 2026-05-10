package com.biolab.pipette.controller;

import com.biolab.pipette.dto.ApiResponse;
import com.biolab.pipette.dto.ExperimentDTO;
import com.biolab.pipette.service.ExperimentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/experiments")
@RequiredArgsConstructor
public class ExperimentController {

    private final ExperimentService experimentService;

    @PostMapping
    public ApiResponse<ExperimentDTO> createExperiment(@RequestBody ExperimentDTO dto) {
        ExperimentDTO created = experimentService.createExperiment(dto);
        return ApiResponse.success("实验方案创建成功", created);
    }

    @GetMapping
    public ApiResponse<List<ExperimentDTO>> getAllExperiments() {
        List<ExperimentDTO> experiments = experimentService.getAllExperiments();
        return ApiResponse.success(experiments);
    }

    @GetMapping("/shared")
    public ApiResponse<List<ExperimentDTO>> getSharedExperiments() {
        List<ExperimentDTO> experiments = experimentService.getSharedExperiments();
        return ApiResponse.success(experiments);
    }

    @GetMapping("/share/{shareCode}")
    public ApiResponse<ExperimentDTO> getExperimentByShareCode(@PathVariable String shareCode) {
        Optional<ExperimentDTO> experiment = experimentService.getExperimentByShareCode(shareCode);
        return experiment
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error("分享码无效或已过期"));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExperimentDTO> getExperimentById(@PathVariable Long id) {
        Optional<ExperimentDTO> experiment = experimentService.getExperimentById(id);
        return experiment
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error("实验方案不存在"));
    }

    @PutMapping("/{id}")
    public ApiResponse<ExperimentDTO> updateExperiment(
            @PathVariable Long id,
            @RequestBody ExperimentDTO dto) {
        Optional<ExperimentDTO> updated = experimentService.updateExperiment(id, dto);
        return updated
                .map(exp -> ApiResponse.success("更新成功", exp))
                .orElseGet(() -> ApiResponse.error("实验方案不存在"));
    }

    @PostMapping("/{id}/share")
    public ApiResponse<ExperimentDTO> shareExperiment(@PathVariable Long id) {
        Optional<ExperimentDTO> shared = experimentService.shareExperiment(id);
        return shared
                .map(exp -> ApiResponse.success("分享成功，分享码: " + exp.getShareCode(), exp))
                .orElseGet(() -> ApiResponse.error("实验方案不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteExperiment(@PathVariable Long id) {
        boolean deleted = experimentService.deleteExperiment(id);
        if (deleted) {
            return ApiResponse.success("删除成功", null);
        }
        return ApiResponse.error("实验方案不存在");
    }
}