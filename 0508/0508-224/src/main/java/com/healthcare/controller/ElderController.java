package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.Elder;
import com.healthcare.service.ElderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elder")
public class ElderController {
    @Autowired
    private ElderService elderService;

    @PostMapping
    public Result<Elder> save(@RequestBody Elder elder) {
        try {
            Elder saved = elderService.save(elder);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        elderService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<Elder> getById(@PathVariable Long id) {
        Elder elder = elderService.findById(id);
        return Result.success(elder);
    }

    @GetMapping("/page")
    public Result<Page<Elder>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String livingStatus,
            @RequestParam(required = false) Long orgId) {
        Page<Elder> result = elderService.findPage(page, size, name, livingStatus, orgId);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<Elder>> list() {
        List<Elder> result = elderService.findAll();
        return Result.success(result);
    }
}
