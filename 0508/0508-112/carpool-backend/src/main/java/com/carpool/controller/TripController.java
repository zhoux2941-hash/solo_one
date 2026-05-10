package com.carpool.controller;

import com.carpool.dto.TripDTO;
import com.carpool.service.TripService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    public ResponseEntity<?> createTrip(
            @Valid @RequestBody TripDTO.CreateTripRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            TripDTO.TripResponse response = tripService.createTrip(userId, request);
            return ResponseEntity.ok(success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchTrips(@Valid @RequestBody TripDTO.SearchTripRequest request) {
        try {
            List<TripDTO.TripResponse> trips = tripService.searchMatchingTrips(request);
            return ResponseEntity.ok(success(trips));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/hot")
    public ResponseEntity<?> getHotTrips() {
        try {
            List<TripDTO.HotCityTrip> hotTrips = tripService.getHotCityTrips();
            return ResponseEntity.ok(success(hotTrips));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentTrips() {
        try {
            List<TripDTO.TripResponse> trips = tripService.getRecentTrips();
            return ResponseEntity.ok(success(trips));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyTrips(HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            List<TripDTO.TripResponse> trips = tripService.getMyTrips(userId);
            return ResponseEntity.ok(success(trips));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<?> getTripDetail(@PathVariable Long tripId) {
        try {
            TripDTO.TripResponse trip = tripService.getTripById(tripId);
            return ResponseEntity.ok(success(trip));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        return result;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message);
        return result;
    }
}
