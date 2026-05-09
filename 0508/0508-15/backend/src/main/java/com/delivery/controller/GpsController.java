package com.delivery.controller;

import com.delivery.dto.GpsReportDTO;
import com.delivery.service.GpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GpsController {

    private final GpsService gpsService;

    @PostMapping("/report")
    public ResponseEntity<Void> reportGps(@RequestBody GpsReportDTO dto) {
        gpsService.reportGps(dto);
        return ResponseEntity.ok().build();
    }
}
