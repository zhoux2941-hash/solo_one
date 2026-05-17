package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborAttendance;
import com.construction.entity.LaborWorkHour;
import com.construction.service.LaborAttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/labor/attendance")
public class LaborAttendanceController {

    @Resource
    private LaborAttendanceService laborAttendanceService;

    @GetMapping("/list")
    public Result<PageResult<LaborAttendance>> getAttendanceList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return laborAttendanceService.getAttendanceList(pageNum, pageSize, projectId, workerId, startDate, endDate);
    }

    @GetMapping("/{id}")
    public Result<LaborAttendance> getAttendanceById(@PathVariable Long id) {
        return laborAttendanceService.getAttendanceById(id);
    }

    @PostMapping("/check-in/{workerId}")
    public Result<LaborAttendance> checkIn(@PathVariable Long workerId) {
        return laborAttendanceService.checkIn(workerId);
    }

    @PostMapping("/check-out/{workerId}")
    public Result<LaborAttendance> checkOut(@PathVariable Long workerId) {
        return laborAttendanceService.checkOut(workerId);
    }

    @PostMapping
    public Result<LaborAttendance> addAttendance(@RequestBody LaborAttendance attendance) {
        return laborAttendanceService.addAttendance(attendance);
    }

    @PutMapping("/{id}")
    public Result<LaborAttendance> updateAttendance(@PathVariable Long id, @RequestBody LaborAttendance attendance) {
        return laborAttendanceService.updateAttendance(id, attendance);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteAttendance(@PathVariable Long id) {
        return laborAttendanceService.deleteAttendance(id);
    }

    @PostMapping("/calculate")
    public Result<LaborWorkHour> calculateWorkHours(
            @RequestParam Long workerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate statisticsDate,
            @RequestParam(defaultValue = "MONTHLY") String statisticsType) {
        return laborAttendanceService.calculateWorkHours(workerId, statisticsDate, statisticsType);
    }

    @GetMapping("/workhour/list")
    public Result<PageResult<LaborWorkHour>> getWorkHourList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String statisticsType) {
        return laborAttendanceService.getWorkHourList(pageNum, pageSize, projectId, workerId, startDate, endDate, statisticsType);
    }
}
