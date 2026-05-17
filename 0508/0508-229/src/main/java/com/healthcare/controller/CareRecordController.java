package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.CareRecord;
import com.healthcare.service.CareRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/care-record")
public class CareRecordController {
    @Autowired
    private CareRecordService careRecordService;

    @PostMapping
    public Result<CareRecord> save(@RequestBody CareRecord careRecord) {
        try {
            CareRecord saved = careRecordService.save(careRecord);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        careRecordService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<CareRecord> getById(@PathVariable Long id) {
        CareRecord careRecord = careRecordService.findById(id);
        return Result.success(careRecord);
    }

    @GetMapping("/page")
    public Result<Page<CareRecord>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long elderId,
            @RequestParam(required = false) Long caregiverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        Page<CareRecord> result = careRecordService.findPage(page, size, elderId, caregiverId, startTime, endTime);
        return Result.success(result);
    }

    @GetMapping("/elder/{elderId}")
    public Result<List<CareRecord>> getByElderId(@PathVariable Long elderId) {
        List<CareRecord> result = careRecordService.findByElderId(elderId);
        return Result.success(result);
    }
}
