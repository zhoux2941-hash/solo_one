package com.playground.simulator.controller;

import com.playground.simulator.dto.*;
import com.playground.simulator.entity.SimulationSummary;
import com.playground.simulator.service.MonteCarloService;
import com.playground.simulator.service.SimulationParamsService;
import com.playground.simulator.service.SimulationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationParamsService paramsService;
    private final SimulationService simulationService;
    private final MonteCarloService monteCarloService;

    public SimulationController(SimulationParamsService paramsService,
                                SimulationService simulationService,
                                MonteCarloService monteCarloService) {
        this.paramsService = paramsService;
        this.simulationService = simulationService;
        this.monteCarloService = monteCarloService;
    }

    @GetMapping("/params")
    public Result<SimulationParamsDTO> getParams() {
        SimulationParamsDTO params = paramsService.getParams();
        return Result.success(params);
    }

    @PostMapping("/params")
    public Result<Void> saveParams(@RequestBody SimulationParamsDTO params) {
        paramsService.saveParams(params);
        return Result.success("参数保存成功", null);
    }

    @PostMapping("/run")
    public Result<SimulationResultDTO> runSimulation() {
        SimulationResultDTO result = simulationService.runSimulation();
        return Result.success("模拟完成", result);
    }

    @PostMapping("/montecarlo")
    public Result<MonteCarloResultDTO> runMonteCarlo() {
        MonteCarloResultDTO result = monteCarloService.runMonteCarlo();
        return Result.success("蒙特卡洛模拟完成", result);
    }

    @PostMapping("/optimize")
    public Result<OptimizationResultDTO> optimizeSlideTime() {
        OptimizationResultDTO result = monteCarloService.findOptimalSlideTime();
        return Result.success("参数优化完成", result);
    }

    @GetMapping("/history")
    public Result<List<SimulationSummary>> getHistory() {
        List<SimulationSummary> history = simulationService.getHistory();
        return Result.success(history);
    }
}
