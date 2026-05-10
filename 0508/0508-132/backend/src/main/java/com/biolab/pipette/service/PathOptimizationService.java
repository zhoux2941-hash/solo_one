package com.biolab.pipette.service;

import com.biolab.pipette.algorithm.TspPathOptimizer;
import com.biolab.pipette.dto.PathOptimizationRequestDTO;
import com.biolab.pipette.dto.PathOptimizationResultDTO;
import com.biolab.pipette.dto.PipetteTaskDTO;
import com.biolab.pipette.dto.WellPositionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PathOptimizationService {

    private final TspPathOptimizer tspPathOptimizer;
    private final TubeRackService tubeRackService;

    @Cacheable(value = "optimizationResults", key = "#request.hashCode()")
    public PathOptimizationResultDTO optimizePath(PathOptimizationRequestDTO request) {
        List<PipetteTaskDTO> tasks = request.getTasks();
        if (tasks == null || tasks.isEmpty()) {
            return PathOptimizationResultDTO.builder()
                    .optimizedOrder(List.of())
                    .totalDistance(0.0)
                    .originalDistance(0.0)
                    .improvementPercentage(0.0)
                    .algorithmUsed("None")
                    .executionTimeMs(0L)
                    .build();
        }

        enrichTasksWithWellInfo(tasks, request.getTubeRackId());
        return tspPathOptimizer.optimize(tasks, request.getStartRow(), request.getStartCol());
    }

    public double calculateManualDistance(List<PipetteTaskDTO> tasks, Integer startRow, Integer startCol) {
        return tspPathOptimizer.calculateManualDistance(tasks, startRow, startCol);
    }

    private void enrichTasksWithWellInfo(List<PipetteTaskDTO> tasks, Long tubeRackId) {
        if (tubeRackId == null) {
            return;
        }

        Map<Long, WellPositionDTO> wellMap = tubeRackService.getTubeRackById(tubeRackId)
                .map(rack -> rack.getWells().stream()
                        .collect(Collectors.toMap(WellPositionDTO::getId, w -> w)))
                .orElse(Map.of());

        for (PipetteTaskDTO task : tasks) {
            if (task.getSourceWellId() != null && wellMap.containsKey(task.getSourceWellId())) {
                WellPositionDTO source = wellMap.get(task.getSourceWellId());
                task.setSourceRow(source.getRowNum());
                task.setSourceCol(source.getColNum());
                task.setSourceWellLabel(source.getLabel());
            }

            if (task.getTargetWellId() != null && wellMap.containsKey(task.getTargetWellId())) {
                WellPositionDTO target = wellMap.get(task.getTargetWellId());
                task.setTargetRow(target.getRowNum());
                task.setTargetCol(target.getColNum());
                task.setTargetWellLabel(target.getLabel());
            }
        }
    }
}