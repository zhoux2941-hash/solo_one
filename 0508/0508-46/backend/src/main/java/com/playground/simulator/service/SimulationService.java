package com.playground.simulator.service;

import com.playground.simulator.dto.*;
import com.playground.simulator.entity.SimulationSummary;
import com.playground.simulator.repository.SimulationSummaryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SimulationService {

    private final SimulationParamsService paramsService;
    private final SimulationSummaryRepository summaryRepository;

    public SimulationService(SimulationParamsService paramsService,
                             SimulationSummaryRepository summaryRepository) {
        this.paramsService = paramsService;
        this.summaryRepository = summaryRepository;
    }

    @Transactional
    public SimulationResultDTO runSimulation() {
        SimulationParamsDTO params = paramsService.getParams();
        String simulationId = UUID.randomUUID().toString().substring(0, 8);

        List<ChildState> childStates = new ArrayList<>();
        for (ChildDTO child : params.getChildren()) {
            int patience = calculatePatience(child.getAge(), params.getPatienceCoefficient());
            childStates.add(new ChildState(child.getName(), child.getAge(), patience));
        }

        Queue<ChildState> queue = new LinkedList<>(childStates);
        List<TimelineEventDTO> timeline = new ArrayList<>();
        int currentTime = 0;
        int slideAvailableTime = 0;

        while (currentTime < params.getTotalSimulationTime()) {
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
                    
                    timeline.add(new TimelineEventDTO(
                            currentChild.getName(),
                            "等待",
                            currentChild.getLastPlayEndTime(),
                            currentTime
                    ));

                    int playEndTime = currentTime + params.getSlideUsageTime();
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
        for (ChildState state : childStates) {
            childResults.add(new ChildResultDTO(
                    state.getName(),
                    state.getAge(),
                    state.hasLeft(),
                    state.getPlaysCount(),
                    state.getTotalWaitTime()
            ));
        }

        int totalPlays = childResults.stream().mapToInt(ChildResultDTO::getPlaysCount).sum();
        int totalWaitTime = childResults.stream().mapToInt(ChildResultDTO::getTotalWaitTime).sum();
        int avgWaitTime = childResults.isEmpty() ? 0 : totalWaitTime / childResults.size();
        int leftEarlyCount = (int) childResults.stream().filter(ChildResultDTO::isLeftEarly).count();

        SimulationSummary summary = new SimulationSummary();
        summary.setSimulationId(simulationId);
        summary.setTotalChildren(params.getChildren().size());
        summary.setPatienceCoefficient(params.getPatienceCoefficient());
        summary.setSlideUsageTime(params.getSlideUsageTime());
        summary.setTotalSimulationTime(params.getTotalSimulationTime());
        summary.setChildrenWhoLeftEarly(leftEarlyCount);
        summary.setTotalPlays(totalPlays);
        summary.setAverageWaitTime(avgWaitTime);
        summary.setSimulationTime(LocalDateTime.now());
        summaryRepository.save(summary);

        return new SimulationResultDTO(
                simulationId,
                childResults,
                timeline,
                params.getTotalSimulationTime()
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

    public List<SimulationSummary> getHistory() {
        return summaryRepository.findAllByOrderBySimulationTimeDesc();
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
