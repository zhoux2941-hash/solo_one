package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.HealthRecord;
import com.healthcare.service.HealthRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health-record")
public class HealthRecordController {
    @Autowired
    private HealthRecordService healthRecordService;

    @PostMapping
    public Result<HealthRecord> save(@RequestBody HealthRecord record) {
        try {
            HealthRecord saved = healthRecordService.save(record);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        healthRecordService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<HealthRecord> getById(@PathVariable Long id) {
        HealthRecord record = healthRecordService.findById(id);
        return Result.success(record);
    }

    @GetMapping("/page")
    public Result<Page<HealthRecord>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long elderId) {
        Page<HealthRecord> result = healthRecordService.findPage(page, size, elderId);
        return Result.success(result);
    }

    @GetMapping("/by-elder/{elderId}")
    public Result<List<HealthRecord>> getByElderId(@PathVariable Long elderId) {
        List<HealthRecord> result = healthRecordService.findByElderId(elderId);
        return Result.success(result);
    }
}
