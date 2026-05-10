package com.charging.controller;

import com.charging.common.ResponseResult;
import com.charging.dto.StatisticsDTO.*;
import com.charging.service.AuthService;
import com.charging.service.StatisticsService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {
    
    private final StatisticsService statisticsService;
    private final AuthService authService;
    
    @GetMapping("/overview")
    public ResponseResult<OverviewStatistics> getOverview(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权访问");
        }
        
        try {
            return ResponseResult.success(statisticsService.getOverviewStatistics());
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/daily")
    public ResponseResult<List<DailyUsage>> getDailyUsage(
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权访问");
        }
        
        if (days < 1 || days > 30) {
            days = 7;
        }
        
        try {
            return ResponseResult.success(statisticsService.getDailyUsageStatistics(days));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/piles")
    public ResponseResult<List<PileStatistics>> getAllPileStatistics(
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权访问");
        }
        
        if (days < 1 || days > 30) {
            days = 7;
        }
        
        try {
            return ResponseResult.success(statisticsService.getAllPileStatistics(days));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/piles/{pileId}")
    public ResponseResult<PileStatistics> getPileStatistics(
            @PathVariable Long pileId,
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权访问");
        }
        
        if (days < 1 || days > 30) {
            days = 7;
        }
        
        try {
            return ResponseResult.success(statisticsService.getPileStatistics(pileId, days));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    @GetMapping("/heatmap")
    public ResponseResult<List<HeatmapData>> getHeatmapData(
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseResult.error(403, "无权访问");
        }
        
        if (days < 1 || days > 30) {
            days = 7;
        }
        
        try {
            return ResponseResult.success(statisticsService.getHeatmapData(days));
        } catch (Exception e) {
            return ResponseResult.error(e.getMessage());
        }
    }
    
    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        
        String token = authHeader.substring(7);
        Claims claims = authService.parseToken(token);
        
        if (claims == null) {
            return false;
        }
        
        String role = claims.get("role", String.class);
        return "ADMIN".equals(role);
    }
}
