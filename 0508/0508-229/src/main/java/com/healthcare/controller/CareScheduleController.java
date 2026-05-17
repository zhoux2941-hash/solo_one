package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.CareSchedule;
import com.healthcare.service.CareScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/care-schedule")
public class CareScheduleController {
    @Autowired
    private CareScheduleService careScheduleService;

    @PostMapping
    public Result<CareSchedule> save(@RequestBody CareSchedule careSchedule) {
        try {
            CareSchedule saved = careScheduleService.save(careSchedule);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        careScheduleService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<CareSchedule> getById(@PathVariable Long id) {
        CareSchedule careSchedule = careScheduleService.findById(id);
        return Result.success(careSchedule);
    }

    @GetMapping("/page")
    public Result<Page<CareSchedule>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long elderId,
            @RequestParam(required = false) Long caregiverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        Page<CareSchedule> result = careScheduleService.findPage(page, size, elderId, caregiverId, startDate, endDate, status);
        return Result.success(result);
    }

    @PostMapping("/auto-assign")
    public Result<List<CareSchedule>> autoAssign(@RequestBody Map<String, Object> params) {
        try {
            LocalDate scheduleDate = params.get("scheduleDate") != null ? 
                LocalDate.parse(params.get("scheduleDate").toString()) : LocalDate.now();
            String careLevel = params.get("careLevel") != null ? params.get("careLevel").toString() : null;
            List<CareSchedule> result = careScheduleService.autoAssignTasks(scheduleDate, careLevel);
            return Result.success("自动派班成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/batch-create")
    public Result<List<CareSchedule>> batchCreate(@RequestBody Map<String, Object> params) {
        try {
            Long elderId = Long.parseLong(params.get("elderId").toString());
            @SuppressWarnings("unchecked")
            List<Long> careItemIds = (List<Long>) params.get("careItemIds");
            LocalDate startDate = LocalDate.parse(params.get("startDate").toString());
            LocalDate endDate = LocalDate.parse(params.get("endDate").toString());
            Long caregiverId = params.get("caregiverId") != null ? Long.parseLong(params.get("caregiverId").toString()) : null;
            
            List<CareSchedule> result = careScheduleService.batchCreateSchedules(elderId, careItemIds, startDate, endDate, caregiverId);
            return Result.success("批量创建成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
