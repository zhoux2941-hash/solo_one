package com.pet.hospital.controller;

import com.pet.hospital.dto.*;
import com.pet.hospital.entity.Vaccine;
import com.pet.hospital.service.VaccineService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vaccines")
@CrossOrigin(origins = "*")
public class VaccineController {

    private final VaccineService vaccineService;

    public VaccineController(VaccineService vaccineService) {
        this.vaccineService = vaccineService;
    }

    @GetMapping
    public ResponseEntity<List<Vaccine>> getAllVaccines() {
        List<Vaccine> vaccines = vaccineService.getAllVaccines();
        return ResponseEntity.ok(vaccines);
    }

    @GetMapping("/stock")
    public ResponseEntity<List<VaccineStockDTO>> getVaccineStock() {
        List<VaccineStockDTO> stock = vaccineService.getVaccineStock();
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/expiring")
    public ResponseEntity<Map<String, Object>> getExpiringBatches() {
        List<VaccineBatchDTO> expiringBatches = vaccineService.getExpiringBatches();
        Map<String, Object> response = new HashMap<>();
        response.put("total", expiringBatches.size());
        response.put("warningDays", 30);
        response.put("batches", expiringBatches);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/use")
    public ResponseEntity<UseVaccineResponse> useVaccine(@Validated @RequestBody UseVaccineRequest request) {
        UseVaccineResponse response = vaccineService.useVaccine(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/expired")
    public ResponseEntity<Map<String, Object>> getExpiredBatches() {
        List<VaccineBatchDTO> expiredBatches = vaccineService.getExpiredBatches();
        Map<String, Object> response = new HashMap<>();
        response.put("total", expiredBatches.size());
        response.put("batches", expiredBatches);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/scrap")
    public ResponseEntity<BatchScrapResponse> scrapBatches(@Validated @RequestBody BatchScrapRequest request) {
        BatchScrapResponse response = vaccineService.scrapBatches(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/scrap-records")
    public ResponseEntity<List<ScrapRecordDTO>> getScrapRecords() {
        List<ScrapRecordDTO> records = vaccineService.getAllScrapRecords();
        return ResponseEntity.ok(records);
    }
}
