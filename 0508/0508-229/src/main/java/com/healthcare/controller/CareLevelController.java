package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.CareLevel;
import com.healthcare.service.CareLevelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/care-level")
public class CareLevelController {
    @Autowired
    private CareLevelService careLevelService;

    @PostMapping
    public Result<CareLevel> save(@RequestBody CareLevel careLevel) {
        try {
            CareLevel saved = careLevelService.save(careLevel);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        careLevelService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<CareLevel> getById(@PathVariable Long id) {
        CareLevel careLevel = careLevelService.findById(id);
        return Result.success(careLevel);
    }

    @GetMapping("/page")
    public Result<Page<CareLevel>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String levelName) {
        Page<CareLevel> result = careLevelService.findPage(page, size, levelName);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<CareLevel>> list() {
        List<CareLevel> result = careLevelService.findAll();
        return Result.success(result);
    }
}
