package com.express.station.controller;

import com.express.station.dto.AllocationResult;
import com.express.station.dto.ParcelRequest;
import com.express.station.entity.Parcel;
import com.express.station.service.ParcelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ParcelController {

    private final ParcelService parcelService;

    @PostMapping("/allocate")
    public ResponseEntity<AllocationResult> allocateParcels(
            @Valid @RequestBody List<ParcelRequest> requests) {
        AllocationResult result = parcelService.allocateParcels(requests);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/allocation/{batchId}")
    public ResponseEntity<AllocationResult> getAllocationByBatch(@PathVariable String batchId) {
        AllocationResult result = parcelService.getAllocationByBatchId(batchId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/shelf-status")
    public ResponseEntity<AllocationResult> getShelfStatus() {
        return ResponseEntity.ok(parcelService.getCurrentShelfStatus());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetShelf() {
        parcelService.resetShelf();
        Map<String, String> response = new HashMap<>();
        response.put("message", "货架已重置");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Parcel>> getAllParcels() {
        return ResponseEntity.ok(parcelService.getAllParcels());
    }

    @GetMapping("/pickup-list")
    public ResponseEntity<List<Parcel>> getPickupList() {
        return ResponseEntity.ok(parcelService.getPickupList());
    }

    @PostMapping("/pickup")
    public ResponseEntity<Map<String, Object>> pickupByCode(@RequestParam String code) {
        Map<String, Object> result = parcelService.pickupByCode(code);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/{parcelNo}")
    public ResponseEntity<Parcel> getParcelByNo(@PathVariable String parcelNo) {
        return parcelService.getParcelByNo(parcelNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParcel(@PathVariable Long id) {
        parcelService.deleteParcel(id);
        return ResponseEntity.noContent().build();
    }
}
