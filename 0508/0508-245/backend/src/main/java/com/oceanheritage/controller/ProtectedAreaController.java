package com.oceanheritage.controller;

import com.oceanheritage.entity.ProtectedArea;
import com.oceanheritage.service.GeofenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/areas")
public class ProtectedAreaController {

    @Autowired
    private GeofenceService geofenceService;

    @GetMapping
    public List<ProtectedArea> getAllAreas() {
        return geofenceService.getAllAreas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProtectedArea> getAreaById(@PathVariable Long id) {
        Optional<ProtectedArea> area = geofenceService.getAreaById(id);
        return area.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ProtectedArea createArea(@RequestBody ProtectedArea area) {
        return geofenceService.saveArea(area);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProtectedArea> updateArea(@PathVariable Long id, @RequestBody ProtectedArea areaDetails) {
        Optional<ProtectedArea> area = geofenceService.getAreaById(id);
        if (area.isPresent()) {
            ProtectedArea updatedArea = area.get();
            updatedArea.setName(areaDetails.getName());
            updatedArea.setDescription(areaDetails.getDescription());
            updatedArea.setCoordinates(areaDetails.getCoordinates());
            updatedArea.setEnabled(areaDetails.getEnabled());
            return ResponseEntity.ok(geofenceService.saveArea(updatedArea));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long id) {
        geofenceService.deleteArea(id);
        return ResponseEntity.ok().build();
    }
}
