package com.community.station.controller;

import com.community.station.entity.Resident;
import com.community.station.service.ResidentService;
import com.community.station.util.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/residents")
@CrossOrigin(origins = "*")
public class ResidentController {

    @Autowired
    private ResidentService residentService;

    @GetMapping
    public List<Resident> getAllResidents() {
        return residentService.getAllResidents();
    }

    @GetMapping("/page")
    public PageResult<Resident> getResidentsByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Resident> residentPage = residentService.getResidentsByPage(page, size);
        return new PageResult<>(residentPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resident> getResidentById(@PathVariable Long id) {
        return residentService.getResidentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createResident(@RequestBody Resident resident) {
        try {
            Resident createdResident = residentService.createResident(resident);
            return ResponseEntity.ok(createdResident);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateResident(@PathVariable Long id, @RequestBody Resident residentDetails) {
        try {
            Resident updatedResident = residentService.updateResident(id, residentDetails);
            return ResponseEntity.ok(updatedResident);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResident(@PathVariable Long id) {
        residentService.deleteResident(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Resident> toggleResidentStatus(@PathVariable Long id) {
        try {
            Resident resident = residentService.toggleResidentStatus(id);
            return ResponseEntity.ok(resident);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
