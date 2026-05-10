package com.biolab.pipette.controller;

import com.biolab.pipette.dto.ApiResponse;
import com.biolab.pipette.dto.TubeRackDTO;
import com.biolab.pipette.dto.WellPositionDTO;
import com.biolab.pipette.service.TubeRackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tube-racks")
@RequiredArgsConstructor
public class TubeRackController {

    private final TubeRackService tubeRackService;

    @PostMapping
    public ApiResponse<TubeRackDTO> createTubeRack(@RequestBody TubeRackDTO dto) {
        TubeRackDTO created = tubeRackService.createTubeRack(dto);
        return ApiResponse.success("试管架创建成功", created);
    }

    @GetMapping
    public ApiResponse<List<TubeRackDTO>> getAllTubeRacks() {
        List<TubeRackDTO> racks = tubeRackService.getAllTubeRacks();
        return ApiResponse.success(racks);
    }

    @GetMapping("/{id}")
    public ApiResponse<TubeRackDTO> getTubeRackById(@PathVariable Long id) {
        Optional<TubeRackDTO> rack = tubeRackService.getTubeRackById(id);
        return rack
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error("试管架不存在"));
    }

    @PutMapping("/{tubeRackId}/wells/{row}/{col}")
    public ApiResponse<WellPositionDTO> updateWellPosition(
            @PathVariable Long tubeRackId,
            @PathVariable Integer row,
            @PathVariable Integer col,
            @RequestBody WellPositionDTO dto) {
        Optional<WellPositionDTO> updated = tubeRackService.updateWellPosition(tubeRackId, row, col, dto);
        return updated
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.error("孔位不存在"));
    }

    @PutMapping("/{tubeRackId}/wells/batch")
    public ApiResponse<List<WellPositionDTO>> updateMultipleWells(
            @PathVariable Long tubeRackId,
            @RequestBody List<WellPositionDTO> wellUpdates) {
        List<WellPositionDTO> updated = tubeRackService.updateMultipleWells(tubeRackId, wellUpdates);
        return ApiResponse.success("批量更新成功", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTubeRack(@PathVariable Long id) {
        boolean deleted = tubeRackService.deleteTubeRack(id);
        if (deleted) {
            return ApiResponse.success("删除成功", null);
        }
        return ApiResponse.error("试管架不存在");
    }
}