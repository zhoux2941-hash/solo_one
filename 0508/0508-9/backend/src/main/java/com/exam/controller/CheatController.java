package com.exam.controller;

import com.exam.dto.ApiResponse;
import com.exam.dto.CheatLogDTO;
import com.exam.service.CheatPatternService;
import com.exam.service.CheatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cheat")
@CrossOrigin(origins = "*")
public class CheatController {
    
    private final CheatService cheatService;
    private final CheatPatternService cheatPatternService;
    
    public CheatController(CheatService cheatService,
                          CheatPatternService cheatPatternService) {
        this.cheatService = cheatService;
        this.cheatPatternService = cheatPatternService;
    }
    
    @PostMapping("/log")
    public ApiResponse<CheatLogDTO> logCheat(@RequestBody CheatLogDTO logDTO) {
        CheatLogDTO saved = cheatService.saveCheatLog(logDTO);
        return ApiResponse.success(saved);
    }
    
    @GetMapping("/statistics/{examId}")
    public ApiResponse<Map<String, Object>> getStatistics(@PathVariable Long examId) {
        Map<String, Object> stats = cheatService.getCheatStatistics(examId);
        return ApiResponse.success(stats);
    }
    
    @GetMapping("/heatmap/{examId}/{userId}")
    public ApiResponse<Map<String, Object>> getHeatMapData(@PathVariable Long examId, 
                                                          @PathVariable Long userId) {
        Map<String, Object> data = cheatService.getHeatMapData(examId, userId);
        return ApiResponse.success(data);
    }
    
    @GetMapping("/trend/{examId}")
    public ApiResponse<List<Map<String, Object>>> getTrendData(@PathVariable Long examId) {
        List<Map<String, Object>> data = cheatService.getTrendData(examId);
        return ApiResponse.success(data);
    }
    
    @GetMapping("/risk/{examId}")
    public ApiResponse<List<Map<String, Object>>> getHighRiskStudents(@PathVariable Long examId) {
        List<Map<String, Object>> students = cheatService.getHighRiskStudents(examId);
        return ApiResponse.success(students);
    }
    
    @GetMapping("/realtime/{examId}")
    public ApiResponse<List<CheatLogDTO>> getRealTimeLogs(@PathVariable Long examId) {
        List<CheatLogDTO> logs = cheatService.getRealTimeCheatLogs(examId);
        return ApiResponse.success(logs);
    }
    
    @GetMapping("/count/{examId}/{userId}")
    public ApiResponse<Long> getCheatCount(@PathVariable Long examId, @PathVariable Long userId) {
        Long count = cheatService.getCheatCountFromRedis(examId, userId);
        return ApiResponse.success(count);
    }
    
    @GetMapping("/patterns")
    public ApiResponse<Map<String, Object>> getCheatPatterns(
            @RequestParam(required = false) Long examId) {
        Map<String, Object> patterns = cheatPatternService.analyzePatterns(examId);
        return ApiResponse.success(patterns);
    }
}
