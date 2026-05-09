package com.company.seatbooking.controller;

import com.company.seatbooking.dto.SeatStatusDTO;
import com.company.seatbooking.entity.Seat;
import com.company.seatbooking.service.SeatService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "http://localhost:3000")
public class SeatController {
    
    private final SeatService seatService;
    
    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }
    
    @GetMapping
    public ResponseEntity<List<Seat>> getAllSeats() {
        return ResponseEntity.ok(seatService.getAllSeats());
    }
    
    @GetMapping("/{seatId}")
    public ResponseEntity<Seat> getSeatById(@PathVariable Long seatId) {
        Seat seat = seatService.getSeatById(seatId);
        if (seat == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(seat);
    }
    
    @GetMapping("/areas")
    public ResponseEntity<List<String>> getAllAreas() {
        return ResponseEntity.ok(seatService.getAllAreas());
    }
    
    @GetMapping("/area/{area}")
    public ResponseEntity<List<Seat>> getSeatsByArea(@PathVariable String area) {
        return ResponseEntity.ok(seatService.getSeatsByArea(area));
    }
    
    @GetMapping("/status")
    public ResponseEntity<List<SeatStatusDTO>> getSeatStatus(
            @RequestParam(required = false) String area,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(seatService.getSeatStatusByDateAndArea(area, date));
    }
    
    @PostMapping
    public ResponseEntity<Seat> createSeat(@RequestBody Seat seat) {
        return ResponseEntity.ok(seatService.createSeat(seat));
    }
    
    @DeleteMapping("/{seatId}")
    public ResponseEntity<Void> deleteSeat(@PathVariable Long seatId) {
        seatService.deleteSeat(seatId);
        return ResponseEntity.noContent().build();
    }
}
