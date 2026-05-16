package com.asset.controller;

import com.asset.model.Asset;
import com.asset.model.AssetStatus;
import com.asset.service.AssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetService assetService;

    @GetMapping
    public List<Asset> getAllAssets() {
        return assetService.getAllAssets();
    }

    @GetMapping("/page")
    public Map<String, Object> getAllAssetsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Asset> assetPage = assetService.getAllAssets(page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("content", assetPage.getContent());
        result.put("totalElements", assetPage.getTotalElements());
        result.put("totalPages", assetPage.getTotalPages());
        result.put("currentPage", assetPage.getNumber());
        result.put("pageSize", assetPage.getSize());
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable Long id) {
        return assetService.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Asset> getAssetsByStatus(@PathVariable AssetStatus status) {
        return assetService.getAssetsByStatus(status);
    }

    @GetMapping("/status/{status}/page")
    public Map<String, Object> getAssetsByStatusPage(
            @PathVariable AssetStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Asset> assetPage = assetService.getAssetsByStatus(status, page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("content", assetPage.getContent());
        result.put("totalElements", assetPage.getTotalElements());
        result.put("totalPages", assetPage.getTotalPages());
        result.put("currentPage", assetPage.getNumber());
        result.put("pageSize", assetPage.getSize());
        return result;
    }

    @PostMapping
    public ResponseEntity<?> createAsset(@RequestBody Asset asset) {
        try {
            Asset createdAsset = assetService.createAsset(asset);
            return ResponseEntity.ok(createdAsset);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable Long id, @RequestBody Asset assetDetails) {
        try {
            Asset updatedAsset = assetService.updateAsset(id, assetDetails);
            return ResponseEntity.ok(updatedAsset);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAsset(@PathVariable Long id) {
        try {
            assetService.deleteAsset(id);
            return ResponseEntity.ok(Map.of("message", "删除成功"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnAsset(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String remarks = body.get("remarks");
            Asset asset = assetService.returnAsset(id, remarks);
            return ResponseEntity.ok(asset);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAssetStatus(@PathVariable Long id, @RequestBody Map<String, AssetStatus> body) {
        try {
            AssetStatus status = body.get("status");
            Asset asset = assetService.updateAssetStatus(id, status);
            return ResponseEntity.ok(asset);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/overdue")
    public List<Asset> getOverdueAssets(@RequestParam(defaultValue = "30") int days) {
        return assetService.getOverdueAssets(days);
    }

    @GetMapping("/overdue/page")
    public Map<String, Object> getOverdueAssetsPage(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Asset> assetPage = assetService.getOverdueAssets(days, page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("content", assetPage.getContent());
        result.put("totalElements", assetPage.getTotalElements());
        result.put("totalPages", assetPage.getTotalPages());
        result.put("currentPage", assetPage.getNumber());
        result.put("pageSize", assetPage.getSize());
        return result;
    }

    @GetMapping("/statistics/departments")
    public Map<String, Map<String, Object>> getDepartmentStatistics() {
        return assetService.getDepartmentStatistics();
    }
}
