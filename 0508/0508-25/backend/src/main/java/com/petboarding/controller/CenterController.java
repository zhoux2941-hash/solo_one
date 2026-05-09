package com.petboarding.controller;

import com.petboarding.entity.BoardingCenter;
import com.petboarding.entity.Room;
import com.petboarding.service.CenterService;
import com.petboarding.service.OccupancyCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/centers")
@RequiredArgsConstructor
public class CenterController {
    
    private final CenterService centerService;
    private final OccupancyCacheService occupancyCacheService;
    
    @GetMapping
    public ResponseEntity<List<BoardingCenter>> getAllCenters() {
        return ResponseEntity.ok(centerService.getAllCenters());
    }
    
    @GetMapping("/with-rooms")
    public ResponseEntity<List<Map<String, Object>>> getAllCentersWithRooms() {
        return ResponseEntity.ok(centerService.getAllCentersWithRooms());
    }
    
    @GetMapping("/{centerId}")
    public ResponseEntity<BoardingCenter> getCenterById(@PathVariable Long centerId) {
        return centerService.getCenterById(centerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{centerId}/with-rooms")
    public ResponseEntity<Map<String, Object>> getCenterWithRooms(@PathVariable Long centerId) {
        return ResponseEntity.ok(centerService.getCenterWithRooms(centerId));
    }
    
    @GetMapping("/{centerId}/rooms")
    public ResponseEntity<List<Room>> getRoomsByCenter(@PathVariable Long centerId) {
        return ResponseEntity.ok(centerService.getRoomsByCenter(centerId));
    }
    
    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(centerService.getAllRooms());
    }
    
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long roomId) {
        return centerService.getRoomById(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/rooms/types")
    public ResponseEntity<List<String>> getAllRoomTypes() {
        return ResponseEntity.ok(centerService.getAllRoomTypes());
    }
    
    @GetMapping("/rooms/{roomId}/occupancy/{year}/{month}")
    public ResponseEntity<List<Boolean>> getRoomMonthOccupancy(
            @PathVariable Long roomId,
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(occupancyCacheService.getMonthOccupancy(roomId, year, month));
    }
    
    @GetMapping("/rooms/{roomId}/available")
    public ResponseEntity<Map<String, Object>> checkRoomAvailability(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        boolean available = occupancyCacheService.isAvailable(roomId, startDate, endDate);
        
        return ResponseEntity.ok(Map.of(
                "roomId", roomId,
                "startDate", startDate,
                "endDate", endDate,
                "available", available
        ));
    }
}
