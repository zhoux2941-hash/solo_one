package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.MaterialCategory;
import com.scenic.service.MaterialCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-category")
public class MaterialCategoryController {

    @Autowired
    private MaterialCategoryService categoryService;

    @GetMapping("/{id}")
    public Result<MaterialCategory> getById(@PathVariable Long id) {
        return categoryService.findById(id)
                .map(Result::success)
                .orElse(Result.error("类别不存在"));
    }

    @GetMapping("/code/{categoryCode}")
    public Result<MaterialCategory> getByCategoryCode(@PathVariable String categoryCode) {
        return categoryService.findByCategoryCode(categoryCode)
                .map(Result::success)
                .orElse(Result.error("类别不存在"));
    }

    @GetMapping("/list")
    public Result<List<MaterialCategory>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return Result.success(categoryService.findByConditions(keyword, status));
    }

    @PostMapping
    public Result<MaterialCategory> create(@RequestBody Map<String, Object> request) {
        MaterialCategory category = new MaterialCategory();
        category.setCategoryCode((String) request.get("categoryCode"));
        category.setCategoryName((String) request.get("categoryName"));
        category.setDescription((String) request.get("description"));
        category.setStatus((String) request.get("status"));
        category.setRemark((String) request.get("remark"));

        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = categoryService.createCategory(category, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (MaterialCategory) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PutMapping("/{id}")
    public Result<MaterialCategory> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        MaterialCategory category = new MaterialCategory();
        category.setCategoryName((String) request.get("categoryName"));
        category.setDescription((String) request.get("description"));
        category.setStatus((String) request.get("status"));
        category.setRemark((String) request.get("remark"));

        Long managerId = request.get("managerId") != null ? Long.valueOf(request.get("managerId").toString()) : null;

        Map<String, Object> result = categoryService.updateCategory(id, category, managerId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (MaterialCategory) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = categoryService.deleteCategory(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(categoryService.getStatistics());
    }
}
