package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.Attendance;
import com.volunteer.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/checkin")
    public CommonResult<Attendance> checkIn(@RequestBody Map<String, Long> params) {
        try {
            Long userId = params.get("userId");
            Long activityId = params.get("activityId");
            Attendance attendance = attendanceService.checkIn(userId, activityId);
            return CommonResult.success("签到成功", attendance);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/checkout")
    public CommonResult<Attendance> checkOut(@RequestBody Map<String, Long> params) {
        try {
            Long userId = params.get("userId");
            Long activityId = params.get("activityId");
            Attendance attendance = attendanceService.checkOut(userId, activityId);
            return CommonResult.success("签退成功", attendance);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public CommonResult<List<Attendance>> listByUser(@PathVariable Long userId) {
        return CommonResult.success(attendanceService.findByUserId(userId));
    }

    @GetMapping("/pending")
    public CommonResult<List<Attendance>> listPending() {
        return CommonResult.success(attendanceService.findPending());
    }

    @GetMapping("/unchecked")
    public CommonResult<List<Attendance>> listUnchecked() {
        return CommonResult.success(attendanceService.findUncheckedOut());
    }

    @PostMapping("/force-checkout/{id}")
    public CommonResult<Attendance> forceCheckOut(@PathVariable Long id, @RequestBody Map<String, Object> params) {
        try {
            Long adminId = Long.valueOf(params.get("adminId").toString());
            Integer customMinutes = params.get("customMinutes") != null 
                ? Integer.valueOf(params.get("customMinutes").toString()) 
                : null;
            Attendance attendance = attendanceService.forceCheckOut(id, adminId, customMinutes);
            return CommonResult.success("强制签退成功", attendance);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/approve/{id}")
    public CommonResult<Attendance> approve(@PathVariable Long id, @RequestBody Map<String, Long> params) {
        try {
            Long adminId = params.get("adminId");
            Attendance attendance = attendanceService.approve(id, adminId);
            return CommonResult.success("审核通过，时间币已发放", attendance);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/reject/{id}")
    public CommonResult<Attendance> reject(@PathVariable Long id, @RequestBody Map<String, Long> params) {
        try {
            Long adminId = params.get("adminId");
            Attendance attendance = attendanceService.reject(id, adminId);
            return CommonResult.success("审核拒绝", attendance);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @GetMapping("/total/{userId}")
    public CommonResult<Integer> getTotalMinutes(@PathVariable Long userId) {
        return CommonResult.success(attendanceService.getTotalApprovedMinutes(userId));
    }
}
