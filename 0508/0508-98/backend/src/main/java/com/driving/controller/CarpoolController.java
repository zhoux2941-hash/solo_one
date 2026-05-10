package com.driving.controller;

import com.driving.common.Result;
import com.driving.dto.CarpoolDTO;
import com.driving.dto.JoinCarpoolDTO;
import com.driving.entity.Coach;
import com.driving.service.CarpoolService;
import com.driving.service.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class CarpoolController {

    @Autowired
    private CarpoolService carpoolService;

    @Autowired
    private CoachService coachService;

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/student/carpool/initiate")
    public Result<Long> initiateCarpool(@RequestBody @Validated CarpoolDTO carpoolDTO) {
        Long studentId = getCurrentUserId();
        Long groupId = carpoolService.initiateCarpool(studentId, carpoolDTO);
        return Result.success("发起拼车成功，等待拼友加入", groupId);
    }

    @PostMapping("/student/carpool/join")
    public Result<Long> joinCarpool(@RequestBody @Validated JoinCarpoolDTO joinDTO) {
        Long studentId = getCurrentUserId();
        Long bookingId = carpoolService.joinCarpool(studentId, joinDTO.getCarpoolGroupId());
        return Result.success("加入拼车成功", bookingId);
    }

    @PostMapping("/student/carpool/{bookingId}/cancel")
    public Result<Void> cancelCarpool(@PathVariable Long bookingId) {
        Long studentId = getCurrentUserId();
        carpoolService.cancelCarpool(studentId, bookingId);
        return Result.success(null);
    }

    @GetMapping("/student/carpool/waiting")
    public Result<Map<String, Object>> getWaitingCarpool(
            @RequestParam Long coachId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate slotDate,
            @RequestParam Integer startHour) {
        Map<String, Object> carpool = carpoolService.getWaitingCarpool(coachId, slotDate, startHour);
        return Result.success(carpool);
    }

    @GetMapping("/student/carpools")
    public Result<List<Map<String, Object>>> getStudentCarpools() {
        Long studentId = getCurrentUserId();
        List<Map<String, Object>> carpools = carpoolService.getStudentCarpools(studentId);
        return Result.success(carpools);
    }

    @PostMapping("/coach/manage/carpool/accept")
    public Result<Map<String, Object>> setAcceptCarpool(@RequestParam Boolean accept) {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        carpoolService.setAcceptCarpool(coach.getId(), accept);

        Map<String, Object> result = new HashMap<>();
        result.put("acceptCarpool", accept);
        return Result.success(result);
    }

    @GetMapping("/coach/manage/carpool/status")
    public Result<Map<String, Object>> getCarpoolStatus() {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("acceptCarpool", coach.getAcceptCarpool() != null && coach.getAcceptCarpool() == 1);
        return Result.success(result);
    }
}