package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.Material;
import com.wenwan.bracelet.service.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<List<Material>> getAllMaterials() {
        return ResponseEntity.ok(materialService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Material> getMaterialById(@PathVariable Long id) {
        Material material = materialService.findById(id);
        return material != null ? ResponseEntity.ok(material) : ResponseEntity.notFound().build();
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Material>> getMaterialsByCategory(@PathVariable String category) {
        try {
            Material.MaterialCategory materialCategory = Material.MaterialCategory.valueOf(category);
            return ResponseEntity.ok(materialService.findByCategory(materialCategory));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Material>> searchMaterials(@RequestParam String name) {
        return ResponseEntity.ok(materialService.searchByName(name));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Material>> getAvailableMaterials() {
        return ResponseEntity.ok(materialService.findAvailableMaterials());
    }

    @PostMapping
    public ResponseEntity<Material> createMaterial(@RequestBody Material material) {
        return ResponseEntity.ok(materialService.save(material));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Material> updateMaterial(@PathVariable Long id, @RequestBody Material materialDetails) {
        Material material = materialService.update(id, materialDetails);
        return material != null ? ResponseEntity.ok(material) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.delete(id);
        return ResponseEntity.ok().build();
    }
}