package com.company.grouporder.controller;

import com.company.grouporder.dto.stats.*;
import com.company.grouporder.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/monthly-orders")
    public ResponseEntity<List<MonthlyStats>> getMonthlyOrderStats(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(statsService.getMonthlyOrderStats(months));
    }

    @GetMapping("/user-monthly")
    public ResponseEntity<List<UserMonthlyStats>> getUserMonthlyStats(
            @RequestParam String userId,
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(statsService.getUserMonthlyStats(userId, months));
    }

    @GetMapping("/user-ranking")
    public ResponseEntity<List<UserRanking>> getUserRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(statsService.getUserRanking(limit));
    }

    @GetMapping("/department-ranking")
    public ResponseEntity<List<DepartmentRanking>> getDepartmentRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(statsService.getDepartmentRanking(limit));
    }

    @GetMapping("/personal-summary")
    public ResponseEntity<Map<String, Object>> getPersonalSummary(
            @RequestParam String userId,
            @RequestParam(required = false) String userName) {
        if (userName == null) {
            userName = userId;
        }
        return ResponseEntity.ok(statsService.getPersonalSummary(userId, userName));
    }
}
