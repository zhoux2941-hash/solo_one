package com.loganalysis.controller;

import com.loganalysis.dto.ApiResponse;
import com.loganalysis.service.LogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 日志统计控制器
 */
@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
@Slf4j
public class LogStatisticsController {

    @Autowired
    private LogService logService;

    /**
     * 获取日志级别分布统计
     */
    @GetMapping("/levels")
    public ApiResponse<Map<String, Long>> getLevelDistribution(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("获取日志级别分布: 开始时间={}, 结束时间={}, 类型={}", 
            startTime, endTime, logType);
        
        try {
            Map<String, Long> distribution = logService.getLevelDistribution(
                startTime, endTime, logType);
            return ApiResponse.success(distribution);
        } catch (Exception e) {
            log.error("获取日志级别分布失败", e);
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取时间直方图统计
     */
    @GetMapping("/histogram")
    public ApiResponse<Map<String, Long>> getTimeHistogram(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "interval", defaultValue = "1h") String interval,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("获取时间直方图: 开始时间={}, 结束时间={}, 间隔={}, 类型={}", 
            startTime, endTime, interval, logType);
        
        try {
            Map<String, Long> histogram = logService.getTimeHistogram(
                startTime, endTime, interval, logType);
            return ApiResponse.success(histogram);
        } catch (Exception e) {
            log.error("获取时间直方图失败", e);
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取 Top N 错误消息
     */
    @GetMapping("/errors/top")
    public ApiResponse<List<Map<String, Object>>> getTopErrorMessages(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "topN", defaultValue = "5") int topN,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("获取 Top {} 错误消息: 开始时间={}, 结束时间={}, 类型={}", 
            topN, startTime, endTime, logType);
        
        try {
            List<Map<String, Object>> topErrors = logService.getTopErrorMessages(
                startTime, endTime, topN, logType);
            return ApiResponse.success(topErrors);
        } catch (Exception e) {
            log.error("获取 Top 错误消息失败", e);
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取综合统计面板数据（所有统计合并）
     */
    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getDashboardStats(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "interval", defaultValue = "1h") String interval,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("获取仪表盘统计: 开始时间={}, 结束时间={}, 间隔={}, 类型={}", 
            startTime, endTime, interval, logType);
        
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // 日志级别分布
            Map<String, Long> levelDistribution = logService.getLevelDistribution(
                startTime, endTime, logType);
            dashboard.put("levelDistribution", levelDistribution);
            
            // 时间直方图
            Map<String, Long> histogram = logService.getTimeHistogram(
                startTime, endTime, interval, logType);
            dashboard.put("timeHistogram", histogram);
            
            // Top 5 错误消息
            List<Map<String, Object>> topErrors = logService.getTopErrorMessages(
                startTime, endTime, 5, logType);
            dashboard.put("topErrors", topErrors);
            
            // 总日志数
            long totalCount = logService.countByCondition(startTime, endTime, null, logType);
            dashboard.put("totalCount", totalCount);
            
            // 错误日志数
            long errorCount = logService.countByCondition(startTime, endTime, "ERROR", logType);
            dashboard.put("errorCount", errorCount);
            
            // 警告日志数
            long warnCount = logService.countByCondition(startTime, endTime, "WARN", logType);
            dashboard.put("warnCount", warnCount);
            
            return ApiResponse.success(dashboard);
            
        } catch (Exception e) {
            log.error("获取仪表盘统计失败", e);
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }
}
