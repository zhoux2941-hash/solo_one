package com.familytree.controller;

import com.familytree.dto.FamilySpaceDTO;
import com.familytree.entity.FamilySpace;
import com.familytree.service.FamilySpaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/family-spaces")
@CrossOrigin
public class FamilySpaceController {
    @Autowired
    private FamilySpaceService familySpaceService;

    @GetMapping
    public ResponseEntity<?> getFamilySpaces() {
        try {
            List<FamilySpace> spaces = familySpaceService.getUserFamilySpaces();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", spaces);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping
    public ResponseEntity<?> createFamilySpace(@Validated @RequestBody FamilySpaceDTO dto) {
        try {
            FamilySpace space = familySpaceService.createFamilySpace(dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "创建成功");
            result.put("data", space);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFamilySpace(@PathVariable Long id) {
        try {
            FamilySpace space = familySpaceService.getFamilySpace(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", space);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFamilySpace(@PathVariable Long id, @Validated @RequestBody FamilySpaceDTO dto) {
        try {
            FamilySpace space = familySpaceService.updateFamilySpace(id, dto);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "更新成功");
            result.put("data", space);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFamilySpace(@PathVariable Long id) {
        try {
            familySpaceService.deleteFamilySpace(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "删除成功");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
