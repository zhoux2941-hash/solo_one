package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.Category;
import com.community.buying.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/public/list")
    public Result<List<Category>> getPublicCategories() {
        return Result.success(categoryService.findByStatus(1));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('product:read')")
    public Result<List<Category>> getAllCategories() {
        return Result.success(categoryService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Category> createCategory(@RequestBody Category category) {
        return Result.success("创建成功", categoryService.save(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        category.setId(id);
        return Result.success("更新成功", categoryService.save(category));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteById(id);
        return Result.success("删除成功");
    }
}