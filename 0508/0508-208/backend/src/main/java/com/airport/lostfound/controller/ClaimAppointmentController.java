package com.airport.lostfound.controller;

import com.airport.lostfound.model.ClaimAppointment;
import com.airport.lostfound.service.ClaimAppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class ClaimAppointmentController {

    @Autowired
    private ClaimAppointmentService claimAppointmentService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ClaimAppointment appointment) {
        try {
            ClaimAppointment saved = claimAppointmentService.save(appointment);
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ClaimAppointment>> findAll() {
        return ResponseEntity.ok(claimAppointmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimAppointment> findById(@PathVariable Long id) {
        Optional<ClaimAppointment> optional = claimAppointmentService.findById(id);
        return optional.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ClaimAppointment>> findByStatus(@PathVariable String status) {
        return ResponseEntity.ok(claimAppointmentService.findByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ClaimAppointment> updateStatus(@PathVariable Long id, @RequestParam String status) {
        ClaimAppointment updated = claimAppointmentService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
