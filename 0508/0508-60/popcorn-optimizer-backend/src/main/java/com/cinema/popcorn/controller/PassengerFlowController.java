package com.cinema.popcorn.controller;

import com.cinema.popcorn.entity.PassengerFlowHistory;
import com.cinema.popcorn.service.PassengerFlowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/passenger-flow")
@RequiredArgsConstructor
public class PassengerFlowController {

    private final PassengerFlowService passengerFlowService;

    @PostMapping
    public ResponseEntity<PassengerFlowHistory> create(@RequestBody PassengerFlowHistory history) {
        PassengerFlowHistory saved = passengerFlowService.save(history);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<PassengerFlowHistory>> createBatch(@RequestBody List<PassengerFlowHistory> histories) {
        List<PassengerFlowHistory> saved = passengerFlowService.saveBatch(histories);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<PassengerFlowHistory>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<PassengerFlowHistory> histories = passengerFlowService.getByDate(date);
        return ResponseEntity.ok(histories);
    }

    @GetMapping("/range")
    public ResponseEntity<List<PassengerFlowHistory>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<PassengerFlowHistory> histories = passengerFlowService.getByDateRange(start, end);
        return ResponseEntity.ok(histories);
    }

    @GetMapping("/peak")
    public ResponseEntity<List<PassengerFlowHistory>> getPeakHourData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int startHour,
            @RequestParam int endHour) {
        List<PassengerFlowHistory> histories = passengerFlowService.getPeakHourData(date, startHour, endHour);
        return ResponseEntity.ok(histories);
    }

    @GetMapping("/average")
    public ResponseEntity<Double> getAverageByHourAndDay(
            @RequestParam int hour,
            @RequestParam int dayOfWeek) {
        Double average = passengerFlowService.getAverageByHourAndDay(hour, dayOfWeek);
        return ResponseEntity.ok(average != null ? average : 0.0);
    }
}
