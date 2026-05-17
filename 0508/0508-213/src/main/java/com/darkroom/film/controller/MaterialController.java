package com.darkroom.film.controller;

import com.darkroom.film.entity.Material;
import com.darkroom.film.service.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin(origins = "*")
public class MaterialController {
    @Autowired
    private MaterialService materialService;

    @GetMapping
    public List<Material> getAllMaterials() {
        return materialService.findAll();
    }

    @GetMapping("/page")
    public Page<Material> getMaterialsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return materialService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Material> getMaterialById(@PathVariable Long id) {
        return materialService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public List<Material> getMaterialsByType(@PathVariable String type) {
        return materialService.findByType(type);
    }

    @PostMapping
    public Material createMaterial(@RequestBody Material material) {
        return materialService.save(material);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Material> updateMaterial(@PathVariable Long id, @RequestBody Material material) {
        return materialService.findById(id)
                .map(existing -> {
                    material.setId(id);
                    return ResponseEntity.ok(materialService.save(material));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Material> updateStock(@PathVariable Long id, @RequestParam int quantity) {
        Material updated = materialService.updateStock(id, quantity);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        return materialService.findById(id)
                .map(material -> {
                    materialService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}