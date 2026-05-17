package com.campsite.controller;

import com.campsite.entity.Facility;
import com.campsite.service.FacilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    @Autowired
    private FacilityService facilityService;

    @GetMapping
    public List<Facility> getAllFacilities() {
        return facilityService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getFacilitiesByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        Page<Facility> pageResult;
        if (type != null && !type.isEmpty()) {
            pageResult = facilityService.findByFacilityType(type, page, size);
        } else if (status != null && !status.isEmpty()) {
            pageResult = facilityService.findByStatus(status, page, size);
        } else {
            pageResult = facilityService.findAll(page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("currentPage", pageResult.getNumber());
        response.put("pageSize", pageResult.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Long id) {
        Optional<Facility> facility = facilityService.findById(id);
        return facility.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{facilityType}")
    public List<Facility> getFacilitiesByType(@PathVariable String facilityType) {
        return facilityService.findByFacilityType(facilityType);
    }

    @GetMapping("/status/{status}")
    public List<Facility> getFacilitiesByStatus(@PathVariable String status) {
        return facilityService.findByStatus(status);
    }

    @PostMapping
    public Facility createFacility(@RequestBody Facility facility) {
        return facilityService.save(facility);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Facility> updateFacility(@PathVariable Long id, @RequestBody Facility facility) {
        Facility updated = facilityService.update(id, facility);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
