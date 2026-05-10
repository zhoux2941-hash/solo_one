package com.festival.volunteer.controller;

import com.festival.volunteer.dto.ApiResponse;
import com.festival.volunteer.dto.ScheduleRequest;
import com.festival.volunteer.entity.Schedule;
import com.festival.volunteer.entity.User;
import com.festival.volunteer.entity.VolunteerApplication;
import com.festival.volunteer.repository.UserRepository;
import com.festival.volunteer.service.ApplicationService;
import com.festival.volunteer.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leader")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaderController {

    private final ApplicationService applicationService;
    private final ScheduleService scheduleService;
    private final UserRepository userRepository;

    @GetMapping("/applications")
    public ApiResponse<List<VolunteerApplication>> getAllApplications() {
        return ApiResponse.success(applicationService.getAllApplications());
    }

    @GetMapping("/applications/pending")
    public ApiResponse<List<VolunteerApplication>> getPendingApplications() {
        return ApiResponse.success(applicationService.getApplicationsByStatus(
            VolunteerApplication.ApplicationStatus.PENDING));
    }

    @GetMapping("/applications/position/{positionId}")
    public ApiResponse<List<VolunteerApplication>> getApplicationsByPosition(@PathVariable Long positionId) {
        return ApiResponse.success(applicationService.getPendingApplicationsByPosition(positionId));
    }

    @PostMapping("/applications/{id}/approve")
    public ApiResponse<VolunteerApplication> approveApplication(@PathVariable Long id) {
        try {
            VolunteerApplication application = applicationService.approve(id);
            return ApiResponse.success("审核通过", application);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/applications/{id}/reject")
    public ApiResponse<VolunteerApplication> rejectApplication(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason) {
        try {
            VolunteerApplication application = applicationService.reject(id, reason);
            return ApiResponse.success("已拒绝", application);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/volunteers")
    public ApiResponse<List<User>> getAllVolunteers() {
        return ApiResponse.success(userRepository.findByRole(User.Role.VOLUNTEER));
    }

    @PostMapping("/schedule")
    public ApiResponse<Schedule> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        try {
            Schedule schedule = scheduleService.createSchedule(request);
            return ApiResponse.success("排班分配成功", schedule);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/schedules")
    public ApiResponse<List<Schedule>> getAllSchedules() {
        return ApiResponse.success(scheduleService.getAllSchedules());
    }

    @GetMapping("/schedules/position/{positionId}")
    public ApiResponse<List<Schedule>> getSchedulesByPosition(@PathVariable Long positionId) {
        return ApiResponse.success(scheduleService.getSchedulesByPosition(positionId));
    }

    @GetMapping("/schedules/date/{date}")
    public ApiResponse<List<Schedule>> getSchedulesByDate(@PathVariable String date) {
        return ApiResponse.success(scheduleService.getSchedulesByDate(date));
    }

    @PostMapping("/schedules/{id}/cancel")
    public ApiResponse<Void> cancelSchedule(@PathVariable Long id) {
        try {
            scheduleService.cancelSchedule(id);
            return ApiResponse.success("已取消", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
