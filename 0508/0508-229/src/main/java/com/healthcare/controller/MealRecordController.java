package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.MealRecord;
import com.healthcare.service.MealRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-record")
public class MealRecordController {
    @Autowired
    private MealRecordService mealRecordService;

    @PostMapping
    public Result<MealRecord> save(@RequestBody MealRecord mealRecord) {
        try {
            MealRecord saved = mealRecordService.save(mealRecord);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        mealRecordService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<MealRecord> getById(@PathVariable Long id) {
        MealRecord mealRecord = mealRecordService.findById(id);
        return Result.success(mealRecord);
    }

    @GetMapping("/page")
    public Result<Page<MealRecord>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long elderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String attendanceStatus) {
        Page<MealRecord> result = mealRecordService.findPage(page, size, elderId, startDate, endDate, attendanceStatus);
        return Result.success(result);
    }

    @GetMapping("/elder/{elderId}")
    public Result<List<MealRecord>> getByElderId(@PathVariable Long elderId) {
        List<MealRecord> result = mealRecordService.findByElderId(elderId);
        return Result.success(result);
    }
}
