package com.familytree.controller;

import com.familytree.service.TreeCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/family-spaces/{familySpaceId}/tree")
@CrossOrigin
public class TreeController {
    @Autowired
    private TreeCacheService treeCacheService;

    @GetMapping
    public ResponseEntity<?> getTreeStructure(@PathVariable Long familySpaceId) {
        try {
            Map<String, Object> tree = treeCacheService.getTreeStructure(familySpaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", tree);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshTreeCache(@PathVariable Long familySpaceId) {
        try {
            treeCacheService.invalidateTreeCache(familySpaceId);
            Map<String, Object> tree = treeCacheService.getTreeStructure(familySpaceId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "缓存已刷新");
            result.put("data", tree);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
