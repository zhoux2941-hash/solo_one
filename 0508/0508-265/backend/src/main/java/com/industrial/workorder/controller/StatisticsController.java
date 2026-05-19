package com.industrial.workorder.controller;

import com.industrial.workorder.dto.DailyStatisticsDTO;
import com.industrial.workorder.dto.WorkOrderStatisticsDTO;
import com.industrial.workorder.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "*")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping("/daily/{date}")
    public ResponseEntity<DailyStatisticsDTO> getDailyStatistics(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyStatisticsDTO statistics = statisticsService.getDailyStatistics(date);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/today")
    public ResponseEntity<DailyStatisticsDTO> getTodayStatistics() {
        LocalDate today = LocalDate.now();
        DailyStatisticsDTO statistics = statisticsService.getDailyStatistics(today);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/range")
    public ResponseEntity<List<DailyStatisticsDTO>> getDateRangeStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DailyStatisticsDTO> statistics = statisticsService.getDateRangeStatistics(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<WorkOrderStatisticsDTO> getAssigneeStatistics(
            @PathVariable Long assigneeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        WorkOrderStatisticsDTO statistics = statisticsService.getAssigneeStatistics(assigneeId, startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/assignees")
    public ResponseEntity<List<WorkOrderStatisticsDTO>> getAllAssigneesStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkOrderStatisticsDTO> statistics = statisticsService.getAllAssigneesStatistics(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        Map<String, Object> overview = statisticsService.getDashboardOverview(date);
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/completion-rate/daily/{date}")
    public ResponseEntity<Map<String, Object>> getDailyCompletionRate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyStatisticsDTO stats = statisticsService.getDailyStatistics(date);
        return ResponseEntity.ok(Map.of(
                "date", date,
                "totalCount", stats.getTotalCount(),
                "completedCount", stats.getCompletedCount(),
                "completionRate", stats.getCompletionRate()
        ));
    }
}
