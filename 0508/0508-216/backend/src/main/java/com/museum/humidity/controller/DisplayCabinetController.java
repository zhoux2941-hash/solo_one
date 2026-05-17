package com.museum.humidity.controller;

import com.museum.humidity.entity.DisplayCabinet;
import com.museum.humidity.service.DisplayCabinetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DisplayCabinetController {
    @Autowired
    private DisplayCabinetService cabinetService;

    @GetMapping
    public List<DisplayCabinet> getAllCabinets() {
        return cabinetService.getAllCabinets();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisplayCabinet> getCabinetById(@PathVariable Long id) {
        return cabinetService.getCabinetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public DisplayCabinet createCabinet(@RequestBody DisplayCabinet cabinet) {
        return cabinetService.createCabinet(cabinet);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisplayCabinet> updateCabinet(@PathVariable Long id, @RequestBody DisplayCabinet cabinetDetails) {
        try {
            DisplayCabinet updatedCabinet = cabinetService.updateCabinet(id, cabinetDetails);
            return ResponseEntity.ok(updatedCabinet);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCabinet(@PathVariable Long id) {
        cabinetService.deleteCabinet(id);
        return ResponseEntity.ok().build();
    }
}
