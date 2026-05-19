package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('admin:all') or hasAuthority('order:read')")
    public Result<Map<String, Object>> getDashboardStats() {
        return Result.success(statisticsService.getDashboardStats());
    }

    @GetMapping("/order-trend")
    @PreAuthorize("hasAuthority('admin:all') or hasAuthority('order:read')")
    public Result<List<Map<String, Object>>> getOrderTrend(@RequestParam(defaultValue = "7") int days) {
        return Result.success(statisticsService.getOrderTrend(days));
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasAuthority('admin:all') or hasAuthority('order:read')")
    public Result<List<Map<String, Object>>> getMonthlyStatistics(@RequestParam(defaultValue = "12") int months) {
        return Result.success(statisticsService.getMonthlyStatistics(months));
    }

    @PostMapping("/refresh-cache")
    @PreAuthorize("hasAuthority('admin:all')")
    @CacheEvict(value = {"dashboardStats", "orderTrend", "monthlyStats"}, allEntries = true)
    public Result<Void> refreshCache() {
        return Result.success("缓存刷新成功");
    }
}