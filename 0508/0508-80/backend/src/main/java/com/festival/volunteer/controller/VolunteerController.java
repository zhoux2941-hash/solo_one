package com.festival.volunteer.controller;

import com.festival.volunteer.dto.ApiResponse;
import com.festival.volunteer.dto.ApplicationRequest;
import com.festival.volunteer.dto.CheckInRequest;
import com.festival.volunteer.dto.ShiftSwapRequestDTO;
import com.festival.volunteer.entity.*;
import com.festival.volunteer.repository.UserRepository;
import com.festival.volunteer.security.JwtTokenProvider;
import com.festival.volunteer.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/volunteer")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VolunteerController {

    private final ApplicationService applicationService;
    private final ScheduleService scheduleService;
    private final CheckInService checkInService;
    private final NotificationService notificationService;
    private final ShiftSwapService shiftSwapService;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserIdFromToken(String token) {
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt);
        }
        throw new RuntimeException("无效的Token");
    }

    @PostMapping("/apply")
    public ApiResponse<VolunteerApplication> apply(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ApplicationRequest request) {
        try {
            Long userId = getUserIdFromToken(token);
            VolunteerApplication application = applicationService.apply(userId, request);
            return ApiResponse.success("申请提交成功", application);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/applications")
    public ApiResponse<List<VolunteerApplication>> myApplications(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(applicationService.getMyApplications(userId));
    }

    @GetMapping("/schedules")
    public ApiResponse<List<Schedule>> mySchedules(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(scheduleService.getMySchedules(userId));
    }

    @GetMapping("/schedule/{id}")
    public ApiResponse<Schedule> getSchedule(@PathVariable Long id) {
        try {
            return ApiResponse.success(scheduleService.getScheduleById(id));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/checkin")
    public ApiResponse<CheckIn> checkIn(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CheckInRequest request) {
        try {
            Long userId = getUserIdFromToken(token);
            CheckIn checkIn = checkInService.checkIn(userId, request);
            return ApiResponse.success("签到成功", checkIn);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/checkin/{scheduleId}")
    public ApiResponse<CheckIn> getCheckInStatus(@PathVariable Long scheduleId) {
        return ApiResponse.success(checkInService.getCheckInByScheduleId(scheduleId));
    }

    @GetMapping("/checkins")
    public ApiResponse<List<CheckIn>> myCheckIns(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(checkInService.getMyCheckIns(userId));
    }

    @GetMapping("/notifications")
    public ApiResponse<List<Notification>> myNotifications(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/notifications/unread-count")
    public ApiResponse<Long> unreadCount(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(notificationService.getUnreadCount(userId));
    }

    @PostMapping("/notifications/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/notifications/read-all")
    public ApiResponse<Void> markAllAsRead(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        notificationService.markAllAsRead(userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/volunteers")
    public ApiResponse<List<User>> getOtherVolunteers(@RequestHeader("Authorization") String token) {
        Long currentUserId = getUserIdFromToken(token);
        List<User> volunteers = userRepository.findByRole(User.Role.VOLUNTEER)
                .stream()
                .filter(v -> !v.getId().equals(currentUserId))
                .collect(Collectors.toList());
        return ApiResponse.success(volunteers);
    }

    @PostMapping("/shift-swap")
    public ApiResponse<ShiftSwapRequest> createSwapRequest(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ShiftSwapRequestDTO request) {
        try {
            Long userId = getUserIdFromToken(token);
            ShiftSwapRequest swapRequest = shiftSwapService.createSwapRequest(userId, request);
            return ApiResponse.success("换班申请已提交，等待对方确认", swapRequest);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/shift-swap/sent")
    public ApiResponse<List<ShiftSwapRequest>> mySentSwapRequests(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(shiftSwapService.getMySentRequests(userId));
    }

    @GetMapping("/shift-swap/received")
    public ApiResponse<List<ShiftSwapRequest>> myReceivedSwapRequests(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ApiResponse.success(shiftSwapService.getMyReceivedRequests(userId));
    }

    @PostMapping("/shift-swap/{id}/accept")
    public ApiResponse<ShiftSwapRequest> acceptSwapRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            Long userId = getUserIdFromToken(token);
            String replyNote = body != null ? body.get("replyNote") : null;
            ShiftSwapRequest request = shiftSwapService.acceptSwapRequest(id, userId, replyNote);
            return ApiResponse.success("已接受换班申请", request);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/shift-swap/{id}/reject")
    public ApiResponse<ShiftSwapRequest> rejectSwapRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            Long userId = getUserIdFromToken(token);
            String replyNote = body != null ? body.get("replyNote") : null;
            ShiftSwapRequest request = shiftSwapService.rejectSwapRequest(id, userId, replyNote);
            return ApiResponse.success("已拒绝换班申请", request);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/shift-swap/{id}/cancel")
    public ApiResponse<ShiftSwapRequest> cancelSwapRequest(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        try {
            Long userId = getUserIdFromToken(token);
            ShiftSwapRequest request = shiftSwapService.cancelSwapRequest(id, userId);
            return ApiResponse.success("已取消换班申请", request);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
