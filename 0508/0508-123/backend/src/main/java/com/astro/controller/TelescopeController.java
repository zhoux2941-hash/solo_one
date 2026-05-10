package com.astro.controller;

import com.astro.entity.Telescope;
import com.astro.repository.TelescopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/telescopes")
@RequiredArgsConstructor
public class TelescopeController {

    private final TelescopeRepository telescopeRepository;

    @GetMapping
    public ResponseEntity<List<Telescope>> getAllTelescopes() {
        List<Telescope> telescopes = telescopeRepository.findAll();
        return ResponseEntity.ok(telescopes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Telescope> getTelescopeById(@PathVariable Long id) {
        return telescopeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Telescope> createTelescope(@RequestBody Telescope telescope) {
        telescope.setStatus("AVAILABLE");
        Telescope saved = telescopeRepository.save(telescope);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Telescope> updateTelescope(@PathVariable Long id, @RequestBody Telescope telescope) {
        return telescopeRepository.findById(id)
                .map(existing -> {
                    if (telescope.getName() != null) existing.setName(telescope.getName());
                    if (telescope.getPrimaryMirror() != null) existing.setPrimaryMirror(telescope.getPrimaryMirror());
                    if (telescope.getCameraModel() != null) existing.setCameraModel(telescope.getCameraModel());
                    if (telescope.getFieldOfView() != null) existing.setFieldOfView(telescope.getFieldOfView());
                    if (telescope.getLimitingMagnitude() != null) existing.setLimitingMagnitude(telescope.getLimitingMagnitude());
                    if (telescope.getStatus() != null) existing.setStatus(telescope.getStatus());
                    if (telescope.getDescription() != null) existing.setDescription(telescope.getDescription());
                    return ResponseEntity.ok(telescopeRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteTelescope(@PathVariable Long id) {
        Map<String, Boolean> response = new HashMap<>();
        if (telescopeRepository.existsById(id)) {
            telescopeRepository.deleteById(id);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            return ResponseEntity.notFound().build();
        }
    }
}
