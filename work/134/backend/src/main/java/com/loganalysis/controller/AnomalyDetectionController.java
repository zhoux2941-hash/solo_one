package com.loganalysis.controller;

import com.loganalysis.dto.ApiResponse;
import com.loganalysis.entity.AnomalyRecord;
import com.loganalysis.repository.AnomalyRecordRepository;
import com.loganalysis.service.AnomalyDetectionService;
import com.loganalysis.service.DingTalkAlertService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/anomalies")
@CrossOrigin(origins = "*")
@Slf4j
public class AnomalyDetectionController {

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    @Autowired
    private AnomalyRecordRepository anomalyRecordRepository;

    @Autowired
    private DingTalkAlertService dingTalkAlertService;

    @GetMapping("/list")
    public ApiResponse<Page<AnomalyRecord>> getAnomalies(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "isAcknowledged", required = false) Boolean isAcknowledged,
            @RequestParam(value = "startTime", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        log.info("获取异常记录列表: page={}, size={}", page, size);

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "anomalyTime"));
            Page<AnomalyRecord> result;

            if (isAcknowledged != null) {
                result = anomalyRecordRepository.findByIsAcknowledgedOrderByAnomalyTimeDesc(isAcknowledged, pageable);
            } else {
                result = anomalyRecordRepository.findAll(pageable);
            }

            return ApiResponse.success(result);

        } catch (Exception e) {
            log.error("获取异常记录列表失败", e);
            return ApiResponse.error("获取异常记录失败: " + e.getMessage());
        }
    }

    @GetMapping("/range")
    public ApiResponse<List<AnomalyRecord>> getAnomaliesByRange(
            @RequestParam(value = "startTime")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("获取时间范围内的异常记录: [{}, {}], logType={}", startTime, endTime, logType);

        try {
            List<AnomalyRecord> anomalies;
            
            if (logType != null && !logType.isEmpty()) {
                anomalies = anomalyRecordRepository.findByTimeRangeAndLogType(startTime, endTime, logType);
            } else {
                anomalies = anomalyRecordRepository.findByAnomalyTimeBetweenOrderByAnomalyTimeAsc(startTime, endTime);
            }

            return ApiResponse.success(anomalies);

        } catch (Exception e) {
            log.error("获取时间范围内的异常记录失败", e);
            return ApiResponse.error("获取异常记录失败: " + e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getAnomalyStats() {
        log.info("获取异常统计信息");

        try {
            Map<String, Object> stats = new HashMap<>();
            
            long unacknowledgedCount = anomalyDetectionService.getUnacknowledgedCount();
            stats.put("unacknowledgedCount", unacknowledgedCount);

            long totalCount = anomalyRecordRepository.count();
            stats.put("totalCount", totalCount);

            List<AnomalyRecord> recent = anomalyDetectionService.getRecentAnomalies(5);
            stats.put("recentAnomalies", recent);

            LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
            LocalDateTime tomorrow = today.plusDays(1);
            long todayCount = anomalyRecordRepository.countUnacknowledgedByTimeRange(today, tomorrow);
            stats.put("todayUnacknowledgedCount", todayCount);

            return ApiResponse.success(stats);

        } catch (Exception e) {
            log.error("获取异常统计信息失败", e);
            return ApiResponse.error("获取统计失败: " + e.getMessage());
        }
    }

    @GetMapping("/detect")
    public ApiResponse<List<AnomalyDetectionService.AnomalyDetectionResult>> detectAnomalies(
            @RequestParam(value = "startTime", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("手动触发异常检测: [{}, {}], logType={}", startTime, endTime, logType);

        try {
            List<AnomalyDetectionService.AnomalyDetectionResult> results = 
                anomalyDetectionService.detectAnomalies(startTime, endTime, logType);

            return ApiResponse.success("检测完成", results);

        } catch (Exception e) {
            log.error("异常检测执行失败", e);
            return ApiResponse.error("检测失败: " + e.getMessage());
        }
    }

    @GetMapping("/detect-range")
    public ApiResponse<List<AnomalyDetectionService.AnomalyDetectionResult>> detectAnomaliesInRange(
            @RequestParam(value = "startTime")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(value = "endTime")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(value = "logType", required = false) String logType) {
        
        log.info("检测时间范围内的异常: [{}, {}], logType={}", startTime, endTime, logType);

        try {
            List<AnomalyDetectionService.AnomalyDetectionResult> results = 
                anomalyDetectionService.detectAnomaliesInRange(startTime, endTime, logType);

            return ApiResponse.success("检测完成", results);

        } catch (Exception e) {
            log.error("异常检测执行失败", e);
            return ApiResponse.error("检测失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/acknowledge")
    public ApiResponse<AnomalyRecord> acknowledgeAnomaly(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        
        log.info("确认异常记录: id={}", id);

        try {
            String acknowledgedBy = body != null ? body.get("acknowledgedBy") : null;
            AnomalyRecord record = anomalyDetectionService.acknowledge(id, acknowledgedBy);

            if (record != null) {
                return ApiResponse.success("确认成功", record);
            } else {
                return ApiResponse.error("异常记录不存在: " + id);
            }

        } catch (Exception e) {
            log.error("确认异常记录失败", e);
            return ApiResponse.error("确认失败: " + e.getMessage());
        }
    }

    @PostMapping("/test-alert")
    public ApiResponse<String> testAlert(@RequestBody(required = false) Map<String, String> body) {
        log.info("测试钉钉报警");

        try {
            String message = body != null ? body.get("message") : null;
            if (message == null || message.isEmpty()) {
                message = "【测试消息】日志分析系统异常报警测试 - " + LocalDateTime.now();
            }

            boolean success = dingTalkAlertService.sendTextAlert(message);

            if (success) {
                return ApiResponse.success("测试报警发送成功");
            } else {
                return ApiResponse.error("测试报警发送失败，请检查配置");
            }

        } catch (Exception e) {
            log.error("测试报警失败", e);
            return ApiResponse.error("测试失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<AnomalyRecord> getAnomalyById(@PathVariable Long id) {
        log.info("获取异常记录详情: id={}", id);

        try {
            Optional<AnomalyRecord> opt = anomalyRecordRepository.findById(id);
            
            if (opt.isPresent()) {
                return ApiResponse.success(opt.get());
            } else {
                return ApiResponse.error("异常记录不存在: " + id);
            }

        } catch (Exception e) {
            log.error("获取异常记录详情失败", e);
            return ApiResponse.error("获取详情失败: " + e.getMessage());
        }
    }
}
