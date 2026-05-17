package com.slaughterhouse.controller;

import com.slaughterhouse.entity.Pig;
import com.slaughterhouse.service.PigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pigs")
@CrossOrigin(origins = "*")
public class PigController {

    @Autowired
    private PigService pigService;

    @PostMapping("/register")
    public ResponseEntity<?> registerPig(@RequestBody Pig pig) {
        try {
            Pig savedPig = pigService.registerPig(pig);
            return ResponseEntity.ok(savedPig);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/quarantine")
    public ResponseEntity<Pig> quarantinePig(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String result = request.get("result");
        String officer = request.get("officer");
        Pig updatedPig = pigService.quarantinePig(id, result, officer);
        if (updatedPig != null) {
            return ResponseEntity.ok(updatedPig);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/associate-carcass")
    public ResponseEntity<Pig> associateCarcass(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String carcassId = request.get("carcassId");
        Pig updatedPig = pigService.associateCarcass(id, carcassId);
        if (updatedPig != null) {
            return ResponseEntity.ok(updatedPig);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/dispose")
    public ResponseEntity<Pig> disposePig(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String disposalInfo = request.get("disposalInfo");
        Pig updatedPig = pigService.disposePig(id, disposalInfo);
        if (updatedPig != null) {
            return ResponseEntity.ok(updatedPig);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<Pig>> getAllPigs() {
        return ResponseEntity.ok(pigService.getAllPigs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pig> getPigById(@PathVariable Long id) {
        Optional<Pig> pig = pigService.getPigById(id);
        return pig.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/rfid/{rfidTag}")
    public ResponseEntity<Pig> getPigByRfidTag(@PathVariable String rfidTag) {
        Optional<Pig> pig = pigService.getPigByRfidTag(rfidTag);
        return pig.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Pig>> getPigsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(pigService.getPigsByStatus(status));
    }

    @GetMapping("/carcass/{carcassId}")
    public ResponseEntity<Pig> getPigByCarcassId(@PathVariable String carcassId) {
        Optional<Pig> pig = pigService.getPigByCarcassId(carcassId);
        return pig.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
