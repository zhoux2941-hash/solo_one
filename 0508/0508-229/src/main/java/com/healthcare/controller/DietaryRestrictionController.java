package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.DietaryRestriction;
import com.healthcare.service.DietaryRestrictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dietary-restriction")
public class DietaryRestrictionController {
    @Autowired
    private DietaryRestrictionService dietaryRestrictionService;

    @PostMapping
    public Result<DietaryRestriction> save(@RequestBody DietaryRestriction dietaryRestriction) {
        try {
            DietaryRestriction saved = dietaryRestrictionService.save(dietaryRestriction);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        dietaryRestrictionService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<DietaryRestriction> getById(@PathVariable Long id) {
        DietaryRestriction dietaryRestriction = dietaryRestrictionService.findById(id);
        return Result.success(dietaryRestriction);
    }

    @GetMapping("/page")
    public Result<Page<DietaryRestriction>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String restrictionName) {
        Page<DietaryRestriction> result = dietaryRestrictionService.findPage(page, size, restrictionName);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<DietaryRestriction>> list() {
        List<DietaryRestriction> result = dietaryRestrictionService.findAll();
        return Result.success(result);
    }
}
