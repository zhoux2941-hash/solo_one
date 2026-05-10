package com.driving.controller;

import com.driving.common.Result;
import com.driving.dto.BookingDTO;
import com.driving.entity.Coach;
import com.driving.service.BookingService;
import com.driving.service.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private CoachService coachService;

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/student/book")
    public Result<Long> bookSlot(@RequestBody BookingDTO bookingDTO) {
        Long studentId = getCurrentUserId();
        Long bookingId = bookingService.bookSlot(studentId, bookingDTO);
        return Result.success("预约成功", bookingId);
    }

    @PostMapping("/student/bookings/{bookingId}/cancel")
    public Result<Void> cancelBooking(@PathVariable Long bookingId) {
        Long studentId = getCurrentUserId();
        bookingService.cancelBooking(studentId, bookingId);
        return Result.success(null);
    }

    @GetMapping("/student/bookings")
    public Result<List<Map<String, Object>>> getStudentBookings() {
        Long studentId = getCurrentUserId();
        List<Map<String, Object>> bookings = bookingService.getStudentBookings(studentId);
        return Result.success(bookings);
    }

    @GetMapping("/coach/manage/bookings")
    public Result<List<Map<String, Object>>> getCoachBookings() {
        Long userId = getCurrentUserId();
        Coach coach = coachService.getCoachByUserId(userId);
        if (coach == null) {
            return Result.error("非教练账号");
        }
        List<Map<String, Object>> bookings = bookingService.getCoachBookings(coach.getId());
        return Result.success(bookings);
    }

    @PostMapping("/coach/manage/bookings/{bookingId}/complete")
    public Result<Void> completeBooking(@PathVariable Long bookingId) {
        bookingService.completeBooking(bookingId);
        return Result.success(null);
    }
}