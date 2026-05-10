package com.tide.controller;

import com.tide.model.MoonPhase;
import com.tide.model.TideRecord;
import com.tide.service.TideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/tide")
public class TideController {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Shanghai");

    @Autowired
    private TideService tideService;

    @GetMapping("/daily/{locationId}")
    public ResponseEntity<List<TideRecord>> getDailyTideTable(
            @PathVariable Long locationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TideRecord> records = tideService.getDailyTideTable(locationId, date);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/monthly/{locationId}")
    public ResponseEntity<List<TideRecord>> getMonthlyTideTable(
            @PathVariable Long locationId,
            @RequestParam int year,
            @RequestParam int month) {
        List<TideRecord> records = tideService.getMonthlyTideTable(locationId, year, month);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/record/{locationId}")
    public ResponseEntity<TideRecord> recordActualTide(
            @PathVariable Long locationId,
            @RequestParam String time,
            @RequestParam Double actualHeight,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String notes) throws IOException {
        
        LocalDateTime localTime = parseTimeWithTimezone(time);
        TideRecord record = tideService.recordActualTide(locationId, localTime, actualHeight, photo, notes);
        return ResponseEntity.ok(record);
    }

    @PutMapping("/record/{recordId}")
    public ResponseEntity<TideRecord> updateActualTide(
            @PathVariable Long recordId,
            @RequestParam(required = false) Double actualHeight,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String notes) throws IOException {
        
        TideRecord record = tideService.updateActualTide(recordId, actualHeight, photo, notes);
        return ResponseEntity.ok(record);
    }

    @GetMapping("/moon-phase")
    public ResponseEntity<MoonPhase> getMoonPhase(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        MoonPhase phase = tideService.getMoonPhase(date);
        return ResponseEntity.ok(phase);
    }

    private LocalDateTime parseTimeWithTimezone(String timeStr) {
        try {
            OffsetDateTime offsetDateTime = OffsetDateTime.parse(timeStr);
            return offsetDateTime.atZoneSameInstant(DEFAULT_ZONE).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(timeStr);
            } catch (Exception ex) {
                throw new RuntimeException("无法解析时间格式: " + timeStr);
            }
        }
    }
}
