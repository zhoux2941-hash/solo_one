package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.BusinessCategory;
import com.scenic.service.BusinessCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/category")
public class BusinessCategoryController {

    @Autowired
    private BusinessCategoryService categoryService;

    @PostMapping
    public Result<BusinessCategory> save(@RequestBody BusinessCategory category) {
        Map<String, Object> result = categoryService.save(category);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (BusinessCategory) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = categoryService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<BusinessCategory> getById(@PathVariable Long id) {
        return categoryService.findById(id)
                .map(Result::success)
                .orElse(Result.error("分类不存在"));
    }

    @GetMapping("/list")
    public Result<List<BusinessCategory>> list() {
        return Result.success(categoryService.findAll());
    }

    @GetMapping("/active")
    public Result<List<BusinessCategory>> active() {
        return Result.success(categoryService.findActive());
    }

    @GetMapping("/page")
    public Result<Page<BusinessCategory>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("sortOrder").ascending().and(Sort.by("id").descending()));
        return Result.success(categoryService.findByPage(keyword, pageable));
    }
}
