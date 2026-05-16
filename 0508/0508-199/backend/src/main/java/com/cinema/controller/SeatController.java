package com.cinema.controller;

import com.cinema.entity.Seat;
import com.cinema.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {
    
    @Autowired
    private SeatService seatService;
    
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<Seat>> getSeatsBySchedule(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(seatService.getSeatsBySchedule(scheduleId));
    }
    
    @PostMapping("/lock")
    public ResponseEntity<Boolean> lockSeats(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Long> seatIds = (List<Long>) request.get("seatIds");
        Long memberId = request.get("memberId") != null ? Long.valueOf(request.get("memberId").toString()) : null;
        int minutes = (int) request.getOrDefault("minutes", 10);
        return ResponseEntity.ok(seatService.lockSeats(seatIds, memberId, minutes));
    }
    
    @PostMapping("/release")
    public ResponseEntity<Void> releaseSeats(@RequestBody List<Long> seatIds) {
        seatService.releaseSeats(seatIds);
        return ResponseEntity.ok().build();
    }
}