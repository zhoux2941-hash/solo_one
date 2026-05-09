package com.company.seatbooking.controller;

import com.company.seatbooking.entity.Booking;
import com.company.seatbooking.service.CheckInService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkin")
@CrossOrigin(origins = "http://localhost:3000")
public class CheckInController {
    
    private final CheckInService checkInService;
    
    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }
    
    @PostMapping("/{bookingId}")
    public ResponseEntity<?> checkIn(@PathVariable Long bookingId) {
        try {
            Booking booking = checkInService.checkIn(bookingId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "签到成功");
            result.put("bookingId", booking.getBookingId());
            result.put("checkInTime", booking.getCheckInTime());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/simulate")
    public ResponseEntity<?> simulateAccessCard(
            @RequestParam Long userId,
            @RequestParam Long seatId) {
        try {
            Booking booking = checkInService.simulateAccessCardCheckIn(userId, seatId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "门禁模拟签到成功");
            result.put("bookingId", booking.getBookingId());
            result.put("seatId", seatId);
            result.put("userId", userId);
            result.put("checkInTime", booking.getCheckInTime());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/user/{userId}/bookings")
    public ResponseEntity<List<Booking>> getUserConfirmedBookings(@PathVariable Long userId) {
        return ResponseEntity.ok(checkInService.getUserConfirmedBookings(userId));
    }
}
