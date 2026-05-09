package com.petboarding.controller;

import com.petboarding.entity.Booking;
import com.petboarding.service.BookingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    
    private final BookingService bookingService;
    
    @GetMapping
    public ResponseEntity<List<Booking>> getBookings(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Long petId) {
        
        if (ownerId != null) {
            return ResponseEntity.ok(bookingService.getBookingsByOwner(ownerId));
        }
        if (petId != null) {
            return ResponseEntity.ok(bookingService.getBookingsByPet(petId));
        }
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long bookingId) {
        return bookingService.getBookingById(bookingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody CreateBookingRequest request) {
        Booking booking = bookingService.createBooking(
                request.getPetId(),
                request.getRoomId(),
                request.getStartDate(),
                request.getEndDate(),
                request.getSpecialRequirements()
        );
        return ResponseEntity.ok(booking);
    }
    
    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.confirmBooking(bookingId));
    }
    
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId));
    }
    
    @PostMapping("/{bookingId}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(bookingService.rejectBooking(bookingId, reason));
    }
    
    @GetMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        boolean available = bookingService.isRoomAvailable(roomId, startDate, endDate);
        
        return ResponseEntity.ok(Map.of(
                "roomId", roomId,
                "startDate", startDate,
                "endDate", endDate,
                "available", available
        ));
    }
    
    @Data
    public static class CreateBookingRequest {
        private Long petId;
        private Long roomId;
        private LocalDate startDate;
        private LocalDate endDate;
        private String specialRequirements;
    }
}
