package com.biolab.pipette.algorithm;

import com.biolab.pipette.dto.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TspPathOptimizer {

    private static final double DEFAULT_UNIT_DISTANCE = 1.0;
    private static final long MAX_EXECUTION_TIME_MS = 3000;
    private static final int SMALL_TASK_THRESHOLD = 10;
    private static final int LARGE_TASK_THRESHOLD = 30;

    private static final int MAX_TIP_USES_PER_REAGENT = 5;
    private static final double VOLUME_ERROR_THRESHOLD_LOW = 2.0;
    private static final double VOLUME_ERROR_THRESHOLD_MEDIUM = 5.0;
    private static final double VOLUME_ERROR_THRESHOLD_HIGH = 10.0;

    private static final Map<String, ReagentInfo> REAGENT_INFO = new HashMap<>();

    static {
        REAGENT_INFO.put("SAMPLE_A", new ReagentInfo("样本A", 0.5, false));
        REAGENT_INFO.put("SAMPLE_B", new ReagentInfo("样本B", 0.5, false));
        REAGENT_INFO.put("SAMPLE_C", new ReagentInfo("样本C", 0.5, false));
        REAGENT_INFO.put("BUFFER", new ReagentInfo("缓冲液", 1.0, true));
        REAGENT_INFO.put("WASTE", new ReagentInfo("废液", 0.0, true));
        REAGENT_INFO.put("EMPTY", new ReagentInfo("空孔", 0.0, false));
    }

    public PathOptimizationResultDTO optimize(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {

        long startTime = System.currentTimeMillis();

        if (tasks == null || tasks.isEmpty()) {
            return buildEmptyResult();
        }

        List<PipetteTaskDTO> originalTasks = new ArrayList<>(tasks);
        double originalDistance = calculateTotalDistance(originalTasks, startRow, startCol);

        List<PipetteTaskDTO> optimizedTasks;
        String algorithmUsed;

        int taskCount = tasks.size();

        if (taskCount <= SMALL_TASK_THRESHOLD) {
            optimizedTasks = nearestNeighborOptimization(tasks, startRow, startCol);
            algorithmUsed = "Nearest Neighbor";
        } else if (taskCount <= LARGE_TASK_THRESHOLD) {
            optimizedTasks = hybridOptimization(tasks, startRow, startCol, startTime);
            algorithmUsed = "Hybrid (NN + 2-opt)";
        } else {
            optimizedTasks = fastGreedyOptimization(tasks, startRow, startCol);
            algorithmUsed = "Fast Greedy Clustering";
        }

        double optimizedDistance = calculateTotalDistance(optimizedTasks, startRow, startCol);
        double improvement = originalDistance > 0 ?
                ((originalDistance - optimizedDistance) / originalDistance) * 100 : 0;

        List<Integer> orderIndices = buildOrderIndices(originalTasks, optimizedTasks);

        for (int i = 0; i < optimizedTasks.size(); i++) {
            optimizedTasks.get(i).setTaskOrder(i + 1);
        }

        List<PathSegmentDTO> segments = buildPathSegments(optimizedTasks, startRow, startCol);

        List<VolumeAccumulationDTO> volumeAccumulations = calculateVolumeAccumulation(optimizedTasks);
        List<TipChangeDTO> tipChanges = detectTipChanges(optimizedTasks);
        int estimatedTipCount = estimateTipCount(tipChanges, optimizedTasks);
        double totalAccumulatedError = volumeAccumulations.stream()
                .mapToDouble(VolumeAccumulationDTO::getAccumulatedError)
                .sum();
        String overallWarning = generateOverallWarning(volumeAccumulations, tipChanges);

        long executionTime = System.currentTimeMillis() - startTime;

        return PathOptimizationResultDTO.builder()
                .optimizedOrder(optimizedTasks)
                .orderIndices(orderIndices)
                .totalDistance(optimizedDistance)
                .originalDistance(originalDistance)
                .improvementPercentage(improvement)
                .algorithmUsed(algorithmUsed)
                .executionTimeMs(executionTime)
                .segments(segments)
                .volumeAccumulations(volumeAccumulations)
                .tipChanges(tipChanges)
                .estimatedTipCount(estimatedTipCount)
                .totalAccumulatedError(totalAccumulatedError)
                .overallWarningMessage(overallWarning)
                .build();
    }

    private List<VolumeAccumulationDTO> calculateVolumeAccumulation(List<PipetteTaskDTO> tasks) {
        Map<String, VolumeStats> statsMap = new LinkedHashMap<>();

        for (PipetteTaskDTO task : tasks) {
            String sourceType = task.getSourceReagentType();
            if (sourceType == null) sourceType = "SAMPLE_A";

            double volume = task.getVolumeUl() != null ? task.getVolumeUl() : 100.0;
            ReagentInfo info = REAGENT_INFO.getOrDefault(sourceType, REAGENT_INFO.get("SAMPLE_A"));

            VolumeStats stats = statsMap.computeIfAbsent(sourceType,
                    k -> new VolumeStats(sourceType, info.getName()));

            stats.totalVolume += volume;
            stats.pipetteCount++;
            stats.accumulatedError += volume * (info.errorRatePerPipette / 100.0);
        }

        List<VolumeAccumulationDTO> result = new ArrayList<>();
        for (Map.Entry<String, VolumeStats> entry : statsMap.entrySet()) {
            VolumeStats stats = entry.getValue();
            double errorPercentage = stats.totalVolume > 0 ?
                    (stats.accumulatedError / stats.totalVolume) * 100 : 0;

            String warningLevel = "NORMAL";
            String warningMessage = "";

            if (errorPercentage >= VOLUME_ERROR_THRESHOLD_HIGH) {
                warningLevel = "HIGH";
                warningMessage = String.format("警告：%s累积误差已达%.2f%%，建议更换吸头或重新校准",
                        stats.reagentTypeName, errorPercentage);
            } else if (errorPercentage >= VOLUME_ERROR_THRESHOLD_MEDIUM) {
                warningLevel = "MEDIUM";
                warningMessage = String.format("注意：%s累积误差为%.2f%%，建议关注",
                        stats.reagentTypeName, errorPercentage);
            } else if (errorPercentage >= VOLUME_ERROR_THRESHOLD_LOW) {
                warningLevel = "LOW";
                warningMessage = String.format("%s累积误差为%.2f%%，在可接受范围内",
                        stats.reagentTypeName, errorPercentage);
            }

            result.add(VolumeAccumulationDTO.builder()
                    .reagentType(stats.reagentType)
                    .reagentTypeName(stats.reagentTypeName)
                    .totalVolumeUl(stats.totalVolume)
                    .pipetteCount(stats.pipetteCount)
                    .accumulatedError(stats.accumulatedError)
                    .errorPercentage(errorPercentage)
                    .warningLevel(warningLevel)
                    .warningMessage(warningMessage)
                    .build());
        }

        return result;
    }

    private List<TipChangeDTO> detectTipChanges(List<PipetteTaskDTO> tasks) {
        List<TipChangeDTO> tipChanges = new ArrayList<>();
        if (tasks.isEmpty()) return tipChanges;

        Map<String, Integer> reagentUseCount = new HashMap<>();
        String currentReagent = null;
        int currentTipGroup = 1;
        int usesInCurrentTip = 0;

        for (int i = 0; i < tasks.size(); i++) {
            PipetteTaskDTO task = tasks.get(i);
            String sourceType = task.getSourceReagentType();
            if (sourceType == null) sourceType = "SAMPLE_A";

            boolean needChange = false;
            String reason = "";
            String recommendation = "";

            if (currentReagent != null && !currentReagent.equals(sourceType)) {
                ReagentInfo currentInfo = REAGENT_INFO.getOrDefault(currentReagent, REAGENT_INFO.get("SAMPLE_A"));
                ReagentInfo newInfo = REAGENT_INFO.getOrDefault(sourceType, REAGENT_INFO.get("SAMPLE_A"));

                if (!currentInfo.canShareTip || !newInfo.canShareTip) {
                    needChange = true;
                    reason = String.format("试剂类型变化：%s → %s，存在交叉污染风险",
                            currentInfo.getName(), newInfo.getName());
                    recommendation = String.format("建议更换新吸头后再吸取%s", newInfo.getName());
                }
            }

            int currentCount = reagentUseCount.getOrDefault(sourceType, 0);
            if (currentCount >= MAX_TIP_USES_PER_REAGENT) {
                needChange = true;
                reason = String.format("同一试剂使用次数过多（已使用%d次）", currentCount);
                recommendation = String.format("已达到推荐使用上限%d次，建议更换吸头", MAX_TIP_USES_PER_REAGENT);
            }

            if (i > 0 && needChange) {
                tipChanges.add(TipChangeDTO.builder()
                        .taskIndex(i)
                        .taskOrder(i + 1)
                        .reason(reason)
                        .recommendation(recommendation)
                        .tipGroupId(currentTipGroup)
                        .sourceWellLabel(task.getSourceWellLabel())
                        .targetWellLabel(task.getTargetWellLabel())
                        .sourceReagentType(sourceType)
                        .targetReagentType(task.getTargetReagentType())
                        .build());
                currentTipGroup++;
                usesInCurrentTip = 0;
                reagentUseCount.clear();
            }

            currentReagent = sourceType;
            reagentUseCount.put(sourceType, currentCount + 1);
            usesInCurrentTip++;
        }

        return tipChanges;
    }

    private int estimateTipCount(List<TipChangeDTO> tipChanges, List<PipetteTaskDTO> tasks) {
        if (tasks.isEmpty()) return 0;
        return tipChanges.size() + 1;
    }

    private String generateOverallWarning(
            List<VolumeAccumulationDTO> accumulations,
            List<TipChangeDTO> tipChanges) {

        StringBuilder warning = new StringBuilder();

        boolean hasHighWarning = accumulations.stream()
                .anyMatch(a -> "HIGH".equals(a.getWarningLevel()));
        boolean hasMediumWarning = accumulations.stream()
                .anyMatch(a -> "MEDIUM".equals(a.getWarningLevel()));

        if (hasHighWarning) {
            warning.append("【重要提醒】检测到高风险累积误差，请务必更换吸头。");
        } else if (hasMediumWarning) {
            warning.append("【注意】存在中等累积误差，建议关注实验精度。");
        }

        if (!tipChanges.isEmpty()) {
            if (warning.length() > 0) warning.append(" ");
            warning.append(String.format("执行过程中需要更换吸头%d次。", tipChanges.size()));
        }

        return warning.length() > 0 ? warning.toString() : "所有指标在正常范围内，实验可正常进行。";
    }

    private List<PipetteTaskDTO> nearestNeighborOptimization(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {

        int n = tasks.size();
        boolean[] visited = new boolean[n];
        List<PipetteTaskDTO> result = new ArrayList<>(n);

        int currentRow = startRow != null ? startRow : tasks.get(0).getSourceRow();
        int currentCol = startCol != null ? startCol : tasks.get(0).getSourceCol();

        for (int i = 0; i < n; i++) {
            int nearestIndex = -1;
            double nearestDistance = Double.MAX_VALUE;

            for (int j = 0; j < n; j++) {
                if (!visited[j]) {
                    PipetteTaskDTO task = tasks.get(j);
                    double distance = calculateDistance(
                            currentRow, currentCol,
                            task.getSourceRow(), task.getSourceCol());
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = j;
                    }
                }
            }

            if (nearestIndex >= 0) {
                visited[nearestIndex] = true;
                PipetteTaskDTO nearest = tasks.get(nearestIndex);
                nearest.setSegmentDistance(nearestDistance + calculateDistance(
                        nearest.getSourceRow(), nearest.getSourceCol(),
                        nearest.getTargetRow(), nearest.getTargetCol()));
                result.add(nearest);

                currentRow = nearest.getTargetRow();
                currentCol = nearest.getTargetCol();
            }
        }

        return result;
    }

    private List<PipetteTaskDTO> hybridOptimization(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol,
            long startTime) {

        List<PipetteTaskDTO> solution = nearestNeighborOptimization(tasks, startRow, startCol);
        applyTwoOpt(solution, startRow, startCol, startTime);
        return solution;
    }

    private void applyTwoOpt(
            List<PipetteTaskDTO> solution,
            Integer startRow,
            Integer startCol,
            long startTime) {

        int n = solution.size();
        if (n < 3) return;

        boolean improved = true;
        int iterations = 0;
        int maxIterations = 100;

        while (improved && iterations < maxIterations &&
                System.currentTimeMillis() - startTime < MAX_EXECUTION_TIME_MS) {
            improved = false;
            iterations++;

            for (int i = 0; i < n - 1 && !improved; i++) {
                for (int j = i + 1; j < n; j++) {
                    double delta = calculateTwoOptDelta(solution, startRow, startCol, i, j);
                    if (delta < -0.001) {
                        reverseSegment(solution, i, j);
                        improved = true;
                    }
                }
            }
        }
    }

    private double calculateTwoOptDelta(
            List<PipetteTaskDTO> solution,
            Integer startRow,
            Integer startCol,
            int i, int j) {

        int n = solution.size();
        if (i >= j || i == 0 && j == n - 1) return 0;

        PipetteTaskDTO taskI = solution.get(i);
        PipetteTaskDTO taskJ = solution.get(j);

        int prevRowI, prevColI;
        if (i == 0) {
            prevRowI = startRow != null ? startRow : solution.get(0).getSourceRow();
            prevColI = startCol != null ? startCol : solution.get(0).getSourceCol();
        } else {
            PipetteTaskDTO prevI = solution.get(i - 1);
            prevRowI = prevI.getTargetRow();
            prevColI = prevI.getTargetCol();
        }

        int prevRowJ, prevColJ;
        if (j == 0) {
            prevRowJ = startRow != null ? startRow : solution.get(0).getSourceRow();
            prevColJ = startCol != null ? startCol : solution.get(0).getSourceCol();
        } else {
            PipetteTaskDTO prevJ = solution.get(j - 1);
            prevRowJ = prevJ.getTargetRow();
            prevColJ = prevJ.getTargetCol();
        }

        double oldDist = calculateDistance(prevRowI, prevColI, taskI.getSourceRow(), taskI.getSourceCol())
                + calculateDistance(prevRowJ, prevColJ, taskJ.getSourceRow(), taskJ.getSourceCol());

        double newDist = calculateDistance(prevRowI, prevColI, taskJ.getSourceRow(), taskJ.getSourceCol())
                + calculateDistance(prevRowJ, prevColJ, taskI.getSourceRow(), taskI.getSourceCol());

        return newDist - oldDist;
    }

    private void reverseSegment(List<PipetteTaskDTO> solution, int i, int j) {
        while (i < j) {
            PipetteTaskDTO temp = solution.get(i);
            solution.set(i, solution.get(j));
            solution.set(j, temp);
            i++;
            j--;
        }
    }

    private List<PipetteTaskDTO> fastGreedyOptimization(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {

        int n = tasks.size();
        List<TaskNode> nodes = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            nodes.add(new TaskNode(i, tasks.get(i)));
        }

        int startR = startRow != null ? startRow : tasks.get(0).getSourceRow();
        int startC = startCol != null ? startCol : tasks.get(0).getSourceCol();

        Map<Integer, List<TaskNode>> clusters = spatialClustering(nodes, 4);

        List<TaskNode> orderedNodes = new ArrayList<>(n);
        List<List<TaskNode>> clusterList = new ArrayList<>(clusters.values());

        clusterList.sort((a, b) -> {
            if (a.isEmpty() || b.isEmpty()) return 0;
            double distA = calculateDistance(startR, startC,
                    a.get(0).task.getSourceRow(), a.get(0).task.getSourceCol());
            double distB = calculateDistance(startR, startC,
                    b.get(0).task.getSourceRow(), b.get(0).task.getSourceCol());
            return Double.compare(distA, distB);
        });

        int currentRow = startR;
        int currentCol = startC;

        for (List<TaskNode> cluster : clusterList) {
            if (cluster.isEmpty()) continue;

            while (!cluster.isEmpty()) {
                int nearestIdx = 0;
                double nearestDist = Double.MAX_VALUE;

                for (int i = 0; i < cluster.size(); i++) {
                    TaskNode node = cluster.get(i);
                    double dist = calculateDistance(currentRow, currentCol,
                            node.task.getSourceRow(), node.task.getSourceCol());
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }

                TaskNode selected = cluster.remove(nearestIdx);
                selected.task.setSegmentDistance(nearestDist + calculateDistance(
                        selected.task.getSourceRow(), selected.task.getSourceCol(),
                        selected.task.getTargetRow(), selected.task.getTargetCol()));
                orderedNodes.add(selected);

                currentRow = selected.task.getTargetRow();
                currentCol = selected.task.getTargetCol();
            }
        }

        List<PipetteTaskDTO> result = new ArrayList<>(n);
        for (TaskNode node : orderedNodes) {
            result.add(node.task);
        }

        return result;
    }

    private Map<Integer, List<TaskNode>> spatialClustering(List<TaskNode> nodes, int numClusters) {
        if (nodes.isEmpty()) return new HashMap<>();

        int minRow = Integer.MAX_VALUE, maxRow = Integer.MIN_VALUE;
        int minCol = Integer.MAX_VALUE, maxCol = Integer.MIN_VALUE;

        for (TaskNode node : nodes) {
            minRow = Math.min(minRow, node.task.getSourceRow());
            maxRow = Math.max(maxRow, node.task.getSourceRow());
            minCol = Math.min(minCol, node.task.getSourceCol());
            maxCol = Math.max(maxCol, node.task.getSourceCol());
        }

        int rowRange = maxRow - minRow + 1;
        int colRange = maxCol - minCol + 1;

        double rowThreshold = minRow + rowRange / 2.0;
        double colThreshold = minCol + colRange / 2.0;

        Map<Integer, List<TaskNode>> clusters = new HashMap<>();
        for (int i = 0; i < 4; i++) {
            clusters.put(i, new ArrayList<>());
        }

        for (TaskNode node : nodes) {
            int clusterId = 0;
            if (node.task.getSourceRow() >= rowThreshold) clusterId += 2;
            if (node.task.getSourceCol() >= colThreshold) clusterId += 1;
            clusters.get(clusterId).add(node);
        }

        return clusters;
    }

    private double calculateTotalDistance(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {

        if (tasks == null || tasks.isEmpty()) {
            return 0.0;
        }

        double total = 0.0;
        int currentRow = startRow != null ? startRow : tasks.get(0).getSourceRow();
        int currentCol = startCol != null ? startCol : tasks.get(0).getSourceCol();

        for (PipetteTaskDTO task : tasks) {
            total += calculateDistance(currentRow, currentCol,
                    task.getSourceRow(), task.getSourceCol());
            total += calculateDistance(task.getSourceRow(), task.getSourceCol(),
                    task.getTargetRow(), task.getTargetCol());

            currentRow = task.getTargetRow();
            currentCol = task.getTargetCol();
        }

        return total;
    }

    private double calculateDistance(int row1, int col1, int row2, int col2) {
        return Math.sqrt(Math.pow(row2 - row1, 2) + Math.pow(col2 - col1, 2)) * DEFAULT_UNIT_DISTANCE;
    }

    private List<Integer> buildOrderIndices(
            List<PipetteTaskDTO> originalTasks,
            List<PipetteTaskDTO> optimizedTasks) {

        List<Integer> orderIndices = new ArrayList<>(optimizedTasks.size());
        Map<Long, Integer> idToIndex = new HashMap<>();

        for (int i = 0; i < originalTasks.size(); i++) {
            PipetteTaskDTO original = originalTasks.get(i);
            if (original.getId() != null) {
                idToIndex.put(original.getId(), i);
            }
        }

        for (PipetteTaskDTO optimized : optimizedTasks) {
            boolean found = false;
            if (optimized.getId() != null && idToIndex.containsKey(optimized.getId())) {
                orderIndices.add(idToIndex.get(optimized.getId()));
                found = true;
            }

            if (!found) {
                for (int i = 0; i < originalTasks.size(); i++) {
                    PipetteTaskDTO original = originalTasks.get(i);
                    if (optimized.getSourceWellId().equals(original.getSourceWellId())
                            && optimized.getTargetWellId().equals(original.getTargetWellId())) {
                        orderIndices.add(i);
                        break;
                    }
                }
            }
        }

        return orderIndices;
    }

    private List<PathSegmentDTO> buildPathSegments(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {

        List<PathSegmentDTO> segments = new ArrayList<>();
        if (tasks == null || tasks.isEmpty()) {
            return segments;
        }

        int currentRow = startRow != null ? startRow : tasks.get(0).getSourceRow();
        int currentCol = startCol != null ? startCol : tasks.get(0).getSourceCol();

        for (int i = 0; i < tasks.size(); i++) {
            PipetteTaskDTO task = tasks.get(i);

            segments.add(PathSegmentDTO.builder()
                    .fromRow(currentRow)
                    .fromCol(currentCol)
                    .toRow(task.getSourceRow())
                    .toCol(task.getSourceCol())
                    .distance(calculateDistance(currentRow, currentCol,
                            task.getSourceRow(), task.getSourceCol()))
                    .description(String.format("第%d步: 移动到源孔位", i + 1))
                    .build());

            segments.add(PathSegmentDTO.builder()
                    .fromRow(task.getSourceRow())
                    .fromCol(task.getSourceCol())
                    .toRow(task.getTargetRow())
                    .toCol(task.getTargetCol())
                    .distance(calculateDistance(task.getSourceRow(), task.getSourceCol(),
                            task.getTargetRow(), task.getTargetCol()))
                    .description(String.format("第%d步: 移液到目标孔位", i + 1))
                    .build());

            currentRow = task.getTargetRow();
            currentCol = task.getTargetCol();
        }

        return segments;
    }

    private PathOptimizationResultDTO buildEmptyResult() {
        return PathOptimizationResultDTO.builder()
                .optimizedOrder(new ArrayList<>())
                .orderIndices(new ArrayList<>())
                .totalDistance(0.0)
                .originalDistance(0.0)
                .improvementPercentage(0.0)
                .algorithmUsed("None")
                .executionTimeMs(0L)
                .segments(new ArrayList<>())
                .volumeAccumulations(new ArrayList<>())
                .tipChanges(new ArrayList<>())
                .estimatedTipCount(0)
                .totalAccumulatedError(0.0)
                .overallWarningMessage("")
                .build();
    }

    public double calculateManualDistance(
            List<PipetteTaskDTO> tasks,
            Integer startRow,
            Integer startCol) {
        return calculateTotalDistance(tasks, startRow, startCol);
    }

    private static class TaskNode {
        int index;
        PipetteTaskDTO task;

        TaskNode(int index, PipetteTaskDTO task) {
            this.index = index;
            this.task = task;
        }
    }

    private static class ReagentInfo {
        String name;
        double errorRatePerPipette;
        boolean canShareTip;

        ReagentInfo(String name, double errorRatePerPipette, boolean canShareTip) {
            this.name = name;
            this.errorRatePerPipette = errorRatePerPipette;
            this.canShareTip = canShareTip;
        }

        String getName() {
            return name;
        }
    }

    private static class VolumeStats {
        String reagentType;
        String reagentTypeName;
        double totalVolume = 0.0;
        int pipetteCount = 0;
        double accumulatedError = 0.0;

        VolumeStats(String reagentType, String reagentTypeName) {
            this.reagentType = reagentType;
            this.reagentTypeName = reagentTypeName;
        }
    }
}