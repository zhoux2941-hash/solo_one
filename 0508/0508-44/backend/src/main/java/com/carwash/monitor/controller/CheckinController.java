package com.carwash.monitor.controller;

import com.carwash.monitor.dto.*;
import com.carwash.monitor.entity.Employee;
import com.carwash.monitor.service.CheckinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkin")
@CrossOrigin(origins = "*")
public class CheckinController {

    @Autowired
    private CheckinService checkinService;

    @PostMapping
    public Result<CheckinResponseDTO> checkin(@RequestBody CheckinRequestDTO request) {
        try {
            if (request.getEmployeeNo() == null || request.getEmployeeNo().trim().isEmpty()) {
                return Result.error("员工工号不能为空");
            }
            CheckinResponseDTO response = checkinService.checkin(request);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/leaderboard")
    public Result<List<LeaderboardDTO>> getWeeklyLeaderboard() {
        try {
            List<LeaderboardDTO> leaderboard = checkinService.getWeeklyLeaderboard();
            return Result.success(leaderboard);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/employee/{employeeNo}")
    public Result<Employee> getEmployeeInfo(@PathVariable String employeeNo) {
        try {
            Employee employee = checkinService.getEmployeeInfo(employeeNo);
            return Result.success(employee);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/records/{employeeNo}")
    public Result<List<CheckinRecordDTO>> getCheckinRecords(@PathVariable String employeeNo) {
        try {
            List<CheckinRecordDTO> records = checkinService.getCheckinRecords(employeeNo);
            return Result.success(records);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
