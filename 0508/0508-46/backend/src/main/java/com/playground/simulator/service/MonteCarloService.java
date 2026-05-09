package com.playground.simulator.service;

import com.playground.simulator.dto.*;
import com.playground.simulator.entity.SimulationSummary;
import com.playground.simulator.repository.SimulationSummaryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class MonteCarloService {

    private static final int MONTE_CARLO_RUNS = 10;
    private static final double RANDOM_VARIATION = 0.1;
    private static final double TARGET_LEAVE_RATE = 0.10;

    private final SimulationParamsService paramsService;
    private final SimulationSummaryRepository summaryRepository;
    private final Random random = new Random();

    public MonteCarloService(SimulationParamsService paramsService,
                             SimulationSummaryRepository summaryRepository) {
        this.paramsService = paramsService;
        this.summaryRepository = summaryRepository;
    }

    @Transactional
    public MonteCarloResultDTO runMonteCarlo() {
        SimulationParamsDTO baseParams = paramsService.getParams();
        
        List<SimulationResultDTO> allResults = new ArrayList<>();
        Map<String, List<Integer>> childWaitTimes = new LinkedHashMap<>();
        
        for (ChildDTO child : baseParams.getChildren()) {
            childWaitTimes.put(child.getName(), new ArrayList<>());
        }

        int totalLeftEarly = 0;
        int totalWaitTime = 0;

        for (int i = 0; i < MONTE_CARLO_RUNS; i++) {
            SimulationResultDTO result = runSingleSimulation(baseParams, true);
            allResults.add(result);

            for (ChildResultDTO childResult : result.getChildResults()) {
                childWaitTimes.get(childResult.getName()).add(childResult.getTotalWaitTime());
                if (childResult.isLeftEarly()) {
                    totalLeftEarly++;
                }
                totalWaitTime += childResult.getTotalWaitTime();
            }
        }

        double averageLeaveRate = (double) totalLeftEarly / (MONTE_CARLO_RUNS * baseParams.getChildren().size());
        double averageWaitTime = (double) totalWaitTime / (MONTE_CARLO_RUNS * baseParams.getChildren().size());

        return new MonteCarloResultDTO(
                MONTE_CARLO_RUNS,
                Math.round(averageLeaveRate * 10000) / 100.0,
                Math.round(averageWaitTime * 100) / 100.0,
                childWaitTimes,
                allResults
        );
    }

    @Transactional
    public OptimizationResultDTO findOptimalSlideTime() {
        SimulationParamsDTO baseParams = paramsService.getParams();
        int currentSlideTime = baseParams.getSlideUsageTime();

        int bestSlideTime = currentSlideTime;
        double bestLeaveRate = Double.MAX_VALUE;
        double bestAvgWait = Double.MAX_VALUE;

        int minTime = Math.max(1, currentSlideTime - 10);
        int maxTime = Math.min(60, currentSlideTime + 10);

        for (int slideTime = minTime; slideTime <= maxTime; slideTime++) {
            SimulationParamsDTO testParams = copyParams(baseParams);
            testParams.setSlideUsageTime(slideTime);

            int totalLeftEarly = 0;
            int totalWaitTime = 0;
            int totalChildren = 0;

            for (int i = 0; i < 5; i++) {
                SimulationResultDTO result = runSingleSimulation(testParams, false);
                for (ChildResultDTO childResult : result.getChildResults()) {
                    totalChildren++;
                    if (childResult.isLeftEarly()) {
                        totalLeftEarly++;
                    }
                    totalWaitTime += childResult.getTotalWaitTime();
                }
            }

            double leaveRate = (double) totalLeftEarly / totalChildren;
            double avgWait = (double) totalWaitTime / totalChildren;

            if (leaveRate <= TARGET_LEAVE_RATE) {
                if (leaveRate < bestLeaveRate || 
                    (leaveRate == bestLeaveRate && avgWait < bestAvgWait)) {
                    bestLeaveRate = leaveRate;
                    bestAvgWait = avgWait;
                    bestSlideTime = slideTime;
                }
            } else if (leaveRate < bestLeaveRate) {
                bestLeaveRate = leaveRate;
                bestAvgWait = avgWait;
                bestSlideTime = slideTime;
            }
        }

        StringBuilder recommendation = new StringBuilder();
        if (bestLeaveRate <= TARGET_LEAVE_RATE) {
            recommendation.append("推荐滑梯使用时间为 ").append(bestSlideTime).append(" 秒，");
            recommendation.append("预计离开率为 ").append(Math.round(bestLeaveRate * 10000) / 100.0).append("%，");
            recommendation.append("低于目标阈值 10%。");
            if (bestSlideTime < currentSlideTime) {
                recommendation.append("建议缩短单次使用时间，让更多孩子有机会游玩。");
            } else if (bestSlideTime > currentSlideTime) {
                recommendation.append("可以适当延长单次使用时间，提升游玩体验。");
            }
        } else {
            recommendation.append("在测试范围内未能找到使离开率低于 10% 的设置。");
            recommendation.append("当前最佳方案为 ").append(bestSlideTime).append(" 秒，");
            recommendation.append("预计离开率为 ").append(Math.round(bestLeaveRate * 10000) / 100.0).append("%。");
            recommendation.append("建议：1) 增加滑梯数量 或 2) 降低耐心系数（提高孩子等待能力假设）。");
        }

        return new OptimizationResultDTO(
                bestLeaveRate <= TARGET_LEAVE_RATE,
                bestSlideTime,
                Math.round(bestLeaveRate * 10000) / 100.0,
                Math.round(bestAvgWait * 100) / 100.0,
                recommendation.toString(),
                currentSlideTime
        );
    }

    private SimulationResultDTO runSingleSimulation(SimulationParamsDTO baseParams, 
                                                    boolean withRandomness) {
        String simulationId = UUID.randomUUID().toString().substring(0, 8);
        
        List<ChildDTO> children = new ArrayList<>(baseParams.getChildren());
        if (withRandomness) {
            Collections.shuffle(children);
        }

        Map<String, ChildState> childStates = new LinkedHashMap<>();
        for (ChildDTO child : children) {
            int basePatience = calculatePatience(child.getAge(), baseParams.getPatienceCoefficient());
            int patience = basePatience;
            if (withRandomness) {
                double variation = 1 + (random.nextDouble() * 2 - 1) * RANDOM_VARIATION;
                patience = Math.max(5, (int) (basePatience * variation));
            }
            childStates.put(child.getName(), new ChildState(child.getName(), child.getAge(), patience));
        }

        Queue<ChildState> queue = new LinkedList<>(childStates.values());
        List<TimelineEventDTO> timeline = new ArrayList<>();
        int currentTime = 0;
        int slideAvailableTime = 0;
        int slideUsageTime = baseParams.getSlideUsageTime();

        while (currentTime < baseParams.getTotalSimulationTime()) {
            Iterator<ChildState> iterator = queue.iterator();
            while (iterator.hasNext()) {
                ChildState child = iterator.next();
                if (!child.hasLeft() && child.getCurrentWaitTime() >= child.getPatience()) {
                    child.setLeft(true);
                    iterator.remove();
                    timeline.add(new TimelineEventDTO(
                            child.getName(),
                            "离开",
                            currentTime,
                            currentTime
                    ));
                }
            }

            if (currentTime >= slideAvailableTime && !queue.isEmpty()) {
                ChildState currentChild = queue.poll();
                if (!currentChild.hasLeft()) {
                    int waitTime = currentTime - currentChild.getLastPlayEndTime();
                    currentChild.addWaitTime(waitTime);
                    
                    if (waitTime > 0) {
                        timeline.add(new TimelineEventDTO(
                                currentChild.getName(),
                                "等待",
                                currentChild.getLastPlayEndTime(),
                                currentTime
                        ));
                    }

                    int actualPlayTime = slideUsageTime;
                    if (withRandomness) {
                        double variation = 1 + (random.nextDouble() * 2 - 1) * 0.05;
                        actualPlayTime = Math.max(1, (int) (slideUsageTime * variation));
                    }
                    int playEndTime = currentTime + actualPlayTime;
                    
                    timeline.add(new TimelineEventDTO(
                            currentChild.getName(),
                            "游玩",
                            currentTime,
                            playEndTime
                    ));

                    currentChild.incrementPlaysCount();
                    currentChild.setLastPlayEndTime(playEndTime);
                    slideAvailableTime = playEndTime;

                    queue.offer(currentChild);
                }
            }

            currentTime++;
            for (ChildState child : queue) {
                child.incrementCurrentWaitTime();
            }
        }

        List<ChildResultDTO> childResults = new ArrayList<>();
        for (ChildDTO originalChild : baseParams.getChildren()) {
            ChildState state = childStates.get(originalChild.getName());
            childResults.add(new ChildResultDTO(
                    state.getName(),
                    state.getAge(),
                    state.hasLeft(),
                    state.getPlaysCount(),
                    state.getTotalWaitTime()
            ));
        }

        return new SimulationResultDTO(
                simulationId,
                childResults,
                timeline,
                baseParams.getTotalSimulationTime()
        );
    }

    private int calculatePatience(int age, int patienceCoefficient) {
        double ageFactor;
        if (age <= 5) {
            ageFactor = 0.5 + (age - 3) * 0.15;
        } else if (age <= 10) {
            ageFactor = 1.0 + (age - 5) * 0.15;
        } else {
            ageFactor = 1.75 + (age - 10) * 0.1;
        }
        return Math.max(5, (int) (patienceCoefficient * ageFactor));
    }

    private SimulationParamsDTO copyParams(SimulationParamsDTO original) {
        List<ChildDTO> childrenCopy = new ArrayList<>();
        for (ChildDTO child : original.getChildren()) {
            childrenCopy.add(new ChildDTO(child.getName(), child.getAge()));
        }
        return new SimulationParamsDTO(
                childrenCopy,
                original.getPatienceCoefficient(),
                original.getSlideUsageTime(),
                original.getTotalSimulationTime()
        );
    }

    private static class ChildState {
        private final String name;
        private final int age;
        private final int patience;
        private boolean left = false;
        private int playsCount = 0;
        private int totalWaitTime = 0;
        private int currentWaitTime = 0;
        private int lastPlayEndTime = 0;

        public ChildState(String name, int age, int patience) {
            this.name = name;
            this.age = age;
            this.patience = patience;
        }

        public String getName() { return name; }
        public int getAge() { return age; }
        public int getPatience() { return patience; }
        public boolean hasLeft() { return left; }
        public void setLeft(boolean left) { this.left = left; }
        public int getPlaysCount() { return playsCount; }
        public void incrementPlaysCount() { this.playsCount++; }
        public int getTotalWaitTime() { return totalWaitTime; }
        public void addWaitTime(int waitTime) { this.totalWaitTime += waitTime; }
        public int getCurrentWaitTime() { return currentWaitTime; }
        public void incrementCurrentWaitTime() { this.currentWaitTime++; }
        public int getLastPlayEndTime() { return lastPlayEndTime; }
        public void setLastPlayEndTime(int time) { 
            this.lastPlayEndTime = time; 
            this.currentWaitTime = 0;
        }
    }
}
