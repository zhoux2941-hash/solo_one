package com.driving.controller;

import com.driving.common.Result;
import com.driving.dto.TimeSlotDTO;
import com.driving.entity.Coach;
import com.driving.service.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach")
@CrossOrigin
public class CoachController {

    @Autowired
    private CoachService coachService;

    @GetMapping("/list")
    public Result<List<Map<String, Object>>> getCoachList() {
        List<Map<String, Object>> coaches = coachService.getCoachList();
        return Result.success(coaches);
    }

    @GetMapping("/{coachId}/slots")
    public Result<List<Map<String, Object>>> getCoachSlots(
            @PathVariable Long coachId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        List<Map<String, Object>> slots = coachService.getCoachSlots(coachId, date);
        return Result.success(slots);
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/manage/set-available")
    public Result<Void> setAvailableSlot(@RequestBody TimeSlotDTO slotDTO) {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        coachService.setAvailableSlot(coach.getId(), slotDTO);
        return Result.success(null);
    }

    @PostMapping("/manage/lock")
    public Result<Void> lockSlot(@RequestBody TimeSlotDTO slotDTO) {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        coachService.lockSlot(coach.getId(), slotDTO);
        return Result.success(null);
    }

    @PostMapping("/manage/unlock")
    public Result<Void> unlockSlot(@RequestBody TimeSlotDTO slotDTO) {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        coachService.unlockSlot(coach.getId(), slotDTO);
        return Result.success(null);
    }
}