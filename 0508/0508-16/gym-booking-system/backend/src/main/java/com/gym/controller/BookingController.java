package com.gym.controller;

import com.gym.dto.BookingMessage;
import com.gym.entity.Booking;
import com.gym.service.BookingService;
import com.gym.service.MessageQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private MessageQueueService messageQueueService;
    
    @PostMapping
    public ResponseEntity<?> bookCourse(@RequestBody Map<String, Object> bookingRequest) {
        try {
            Long userId = Long.valueOf(bookingRequest.get("userId").toString());
            String userName = (String) bookingRequest.get("userName");
            Long courseId = Long.valueOf(bookingRequest.get("courseId").toString());
            
            BookingMessage message = bookingService.bookCourseAtomically(userId, userName, courseId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "预约请求已提交，正在处理中");
            response.put("messageId", message.getMessageId());
            response.put("userId", userId);
            response.put("courseId", courseId);
            response.put("bookTime", message.getBookTime());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/checkin")
    public ResponseEntity<?> checkIn(@PathVariable Long id) {
        try {
            Booking booking = bookingService.checkIn(id);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            bookingService.cancelBooking(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}")
    public List<Booking> getBookingsByUser(@PathVariable Long userId) {
        return bookingService.getBookingsByUser(userId);
    }
    
    @GetMapping("/course/{courseId}")
    public List<Booking> getBookingsByCourse(@PathVariable Long courseId) {
        return bookingService.getBookingsByCourse(courseId);
    }
    
    @GetMapping("/user/{userId}/course/{courseId}")
    public ResponseEntity<Booking> getBookingByUserAndCourse(
            @PathVariable Long userId, 
            @PathVariable Long courseId) {
        return bookingService.getBookingByUserAndCourse(userId, courseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/queue/status")
    public ResponseEntity<Map<String, Object>> getQueueStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("pendingQueueSize", messageQueueService.getPendingQueueSize());
        status.put("processingQueueSize", messageQueueService.getProcessingQueueSize());
        status.put("dlqSize", messageQueueService.getDLQSize());
        return ResponseEntity.ok(status);
    }
}
