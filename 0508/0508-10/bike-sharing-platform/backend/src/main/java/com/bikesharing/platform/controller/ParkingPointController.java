package com.bikesharing.platform.controller;

import com.bikesharing.platform.dto.ParkingPointStatusDTO;
import com.bikesharing.platform.service.ParkingPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/parking-points")
@RequiredArgsConstructor
public class ParkingPointController {

    private final ParkingPointService parkingPointService;

    @GetMapping("/status")
    public ResponseEntity<List<ParkingPointStatusDTO>> getAllStatus() {
        List<ParkingPointStatusDTO> statuses = parkingPointService.getAllParkingPointStatus();
        return ResponseEntity.ok(statuses);
    }
}
