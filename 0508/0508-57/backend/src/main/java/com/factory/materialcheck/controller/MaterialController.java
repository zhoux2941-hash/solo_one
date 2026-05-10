package com.factory.materialcheck.controller;

import com.factory.materialcheck.dto.CheckResultDTO;
import com.factory.materialcheck.entity.Material;
import com.factory.materialcheck.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    public ResponseEntity<List<Material>> getAllMaterials() {
        return ResponseEntity.ok(materialService.getAllMaterials());
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkKitRate(@RequestParam Integer orderQuantity) {
        try {
            CheckResultDTO result = materialService.checkKitRate(orderQuantity);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
