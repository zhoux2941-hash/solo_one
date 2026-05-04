package com.loganalysis.controller;

import com.loganalysis.dto.ApiResponse;
import com.loganalysis.dto.LogSearchRequest;
import com.loganalysis.entity.LogEntry;
import com.loganalysis.service.LogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 日志查询控制器
 */
@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
@Slf4j
public class LogSearchController {

    @Autowired
    private LogService logService;

    /**
     * 高级日志搜索（支持多条件过滤）
     */
    @PostMapping("/search")
    public ApiResponse<Map<String, Object>> searchLogs(@RequestBody LogSearchRequest request) {
        log.info("搜索日志: 关键词={}, 级别={}, 类型={}, 时间范围={}~{}", 
            request.getKeyword(), request.getLevel(), request.getLogType(),
            request.getStartTime(), request.getEndTime());
        
        try {
            Pageable pageable = PageRequest.of(request.getPage(), request.getSize());
            
            Page<LogEntry> resultPage = logService.searchLogs(
                request.getStartTime(),
                request.getEndTime(),
                request.getKeyword(),
                request.getLevel(),
                request.getLogType(),
                request.getSource(),
                pageable
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("content", resultPage.getContent());
            result.put("totalElements", resultPage.getTotalElements());
            result.put("totalPages", resultPage.getTotalPages());
            result.put("currentPage", resultPage.getNumber());
            result.put("pageSize", resultPage.getSize());
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            log.error("搜索日志失败", e);
            return ApiResponse.error("搜索失败: " + e.getMessage());
        }
    }

    /**
     * GET 方式搜索日志（用于简单查询）
     */
    @GetMapping("/search")
    public ApiResponse<Map<String, Object>> searchLogsGet(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "logType", required = false) String logType,
            @RequestParam(value = "source", required = false) String source,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        
        log.info("GET 搜索日志: 关键词={}, 级别={}, 类型={}", keyword, level, logType);
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            
            Page<LogEntry> resultPage = logService.searchLogs(
                startTime,
                endTime,
                keyword,
                level,
                logType,
                source,
                pageable
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("content", resultPage.getContent());
            result.put("totalElements", resultPage.getTotalElements());
            result.put("totalPages", resultPage.getTotalPages());
            result.put("currentPage", resultPage.getNumber());
            result.put("pageSize", resultPage.getSize());
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            log.error("搜索日志失败", e);
            return ApiResponse.error("搜索失败: " + e.getMessage());
        }
    }

    /**
     * 根据 ID 获取日志详情
     */
    @GetMapping("/{id}")
    public ApiResponse<LogEntry> getLogById(@PathVariable String id) {
        log.info("获取日志详情: {}", id);
        
        return logService.findById(id)
            .map(logEntry -> ApiResponse.success(logEntry))
            .orElse(ApiResponse.error("日志不存在: " + id));
    }

    /**
     * 获取日志总数
     */
    @GetMapping("/count")
    public ApiResponse<Map<String, Object>> getLogCount(
            @RequestParam(value = "startTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("统计日志数量: 开始时间={}, 结束时间={}, 级别={}, 类型={}", 
            startTime, endTime, level, logType);
        
        try {
            long count;
            
            if (startTime == null && endTime == null && level == null && logType == null) {
                count = logService.countAll();
            } else {
                count = logService.countByCondition(startTime, endTime, level, logType);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("count", count);
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            log.error("统计日志数量失败", e);
            return ApiResponse.error("统计失败: " + e.getMessage());
        }
    }
}
