package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Material;
import com.scenic.service.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material")
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    @GetMapping("/{id}")
    public Result<Material> getById(@PathVariable Long id) {
        return materialService.findById(id)
                .map(Result::success)
                .orElse(Result.error("物资不存在"));
    }

    @GetMapping("/code/{materialCode}")
    public Result<Material> getByMaterialCode(@PathVariable String materialCode) {
        return materialService.findByMaterialCode(materialCode)
                .map(Result::success)
                .orElse(Result.error("物资不存在"));
    }

    @GetMapping("/page")
    public Result<Page<Material>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        Long categoryIdLong = null;
        if (categoryId != null && !categoryId.trim().isEmpty() && !"null".equalsIgnoreCase(categoryId)) {
            try {
                categoryIdLong = Long.valueOf(categoryId);
            } catch (NumberFormatException e) {
                categoryIdLong = null;
            }
        }
        return Result.success(materialService.findByPage(keyword, status, categoryIdLong, pageable));
    }

    @GetMapping("/low-stock")
    public Result<List<Material>> getLowStockMaterials() {
        return Result.success(materialService.findLowStockMaterials());
    }

    @GetMapping("/low-stock/count")
    public Result<Long> countLowStockMaterials() {
        return Result.success(materialService.countLowStockMaterials());
    }

    @PostMapping
    public Result<Material> create(@RequestBody Map<String, Object> request) {
        Material material = new Material();
        material.setMaterialCode((String) request.get("materialCode"));
        material.setMaterialName((String) request.get("materialName"));
        material.setSpecification((String) request.get("specification"));
        material.setUnit((String) request.get("unit"));
        material.setUnitPrice(request.get("unitPrice") != null ? new java.math.BigDecimal(request.get("unitPrice").toString()) : null);
        material.setMinStock(request.get("minStock") != null ? Integer.valueOf(request.get("minStock").toString()) : 10);
        material.setMaxStock(request.get("maxStock") != null ? Integer.valueOf(request.get("maxStock").toString()) : 1000);
        material.setStorageLocation((String) request.get("storageLocation"));
        material.setStatus((String) request.get("status"));
        material.setRemark((String) request.get("remark"));

        Long categoryId = Long.valueOf(request.get("categoryId").toString());
        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = materialService.createMaterial(material, categoryId, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Material) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PutMapping("/{id}")
    public Result<Material> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Material material = new Material();
        material.setMaterialName((String) request.get("materialName"));
        material.setSpecification((String) request.get("specification"));
        material.setUnit((String) request.get("unit"));
        material.setUnitPrice(request.get("unitPrice") != null ? new java.math.BigDecimal(request.get("unitPrice").toString()) : null);
        material.setMinStock(request.get("minStock") != null ? Integer.valueOf(request.get("minStock").toString()) : 10);
        material.setMaxStock(request.get("maxStock") != null ? Integer.valueOf(request.get("maxStock").toString()) : 1000);
        material.setStorageLocation((String) request.get("storageLocation"));
        material.setStatus((String) request.get("status"));
        material.setRemark((String) request.get("remark"));

        Long categoryId = request.get("categoryId") != null ? Long.valueOf(request.get("categoryId").toString()) : null;
        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = materialService.updateMaterial(id, material, categoryId, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Material) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = materialService.deleteMaterial(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(materialService.getStatistics());
    }
}
