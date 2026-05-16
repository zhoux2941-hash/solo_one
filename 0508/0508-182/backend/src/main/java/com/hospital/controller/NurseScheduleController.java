package com.hospital.controller;

import com.hospital.entity.NurseSchedule;
import com.hospital.entity.ScheduleSwapRequest;
import com.hospital.service.NurseScheduleService;
import com.hospital.service.ScheduleValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "http://localhost:5173")
public class NurseScheduleController {
    @Autowired
    private NurseScheduleService scheduleService;

    @GetMapping
    public List<NurseSchedule> getSchedulesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return scheduleService.getSchedulesByDateRange(start, end);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NurseSchedule> getScheduleById(@PathVariable Long id) {
        return scheduleService.getScheduleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody NurseSchedule schedule) {
        try {
            return ResponseEntity.ok(scheduleService.createSchedule(schedule));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NurseSchedule> updateSchedule(@PathVariable Long id, @RequestBody NurseSchedule scheduleDetails) {
        try {
            return ResponseEntity.ok(scheduleService.updateSchedule(id, scheduleDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/swap-request")
    public ScheduleSwapRequest requestSwap(@RequestBody Map<String, Long> swapInfo) {
        return scheduleService.requestSwap(swapInfo.get("fromScheduleId"), swapInfo.get("toScheduleId"));
    }

    @PostMapping("/swap-request/{id}/approve")
    public ResponseEntity<ScheduleSwapRequest> approveSwap(
            @PathVariable Long id, 
            @RequestBody Map<String, String> approverInfo) {
        try {
            return ResponseEntity.ok(scheduleService.approveSwap(id, approverInfo.get("approvedBy")));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/swap-requests/pending")
    public List<ScheduleSwapRequest> getPendingSwapRequests() {
        return scheduleService.getPendingSwapRequests();
    }

    @GetMapping("/validate/icu-coverage")
    public ScheduleValidationService.ValidationResult validateIcuCoverage(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return scheduleService.getIcuCoverageValidation(date);
    }
}
