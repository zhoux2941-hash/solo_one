package com.astro.controller;

import com.astro.dto.BookingRequest;
import com.astro.dto.BookingResponse;
import com.astro.dto.SlotInfo;
import com.astro.entity.Booking;
import com.astro.service.BookingCacheService;
import com.astro.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingCacheService bookingCacheService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/slots/{telescopeId}")
    public ResponseEntity<List<SlotInfo>> getSlotsForDate(
            @PathVariable Long telescopeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<SlotInfo> slots = bookingCacheService.getTelescopeSlotsForDate(telescopeId, date);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable String userId) {
        List<Booking> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long bookingId) {
        Booking booking = bookingService.getBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam String userId) {
        bookingService.cancelBooking(bookingId, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "预约已取消");
        return ResponseEntity.ok(response);
    }
}
