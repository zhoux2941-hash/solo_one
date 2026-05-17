package com.museum.humidity.controller;

import com.museum.humidity.entity.HumidityRecord;
import com.museum.humidity.service.HumidityRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/humidity")
public class HumidityRecordController {
    @Autowired
    private HumidityRecordService recordService;

    @PostMapping
    public HumidityRecord addRecord(@RequestParam Long deviceId, @RequestParam Double humidity) {
        return recordService.addRecord(deviceId, humidity);
    }

    @GetMapping("/device/{deviceId}")
    public List<HumidityRecord> getRecordsByDeviceId(
            @PathVariable Long deviceId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false, defaultValue = "20") Integer limit) {
        
        if (period != null) {
            LocalDateTime end = LocalDateTime.now();
            LocalDateTime start;
            switch (period) {
                case "24h":
                    start = end.minusHours(24);
                    break;
                case "7d":
                    start = end.minusDays(7);
                    break;
                case "30d":
                    start = end.minusDays(30);
                    break;
                default:
                    start = end.minusHours(24);
            }
            return recordService.getRecordsByDeviceIdAndTimeRange(deviceId, start, end);
        }
        
        return recordService.getRecentRecords(deviceId, limit);
    }
}
