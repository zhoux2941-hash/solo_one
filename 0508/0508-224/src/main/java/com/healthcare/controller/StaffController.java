package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.Staff;
import com.healthcare.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
    @Autowired
    private StaffService staffService;

    @PostMapping
    public Result<Staff> save(@RequestBody Staff staff) {
        try {
            Staff saved = staffService.save(staff);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        staffService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<Staff> getById(@PathVariable Long id) {
        Staff staff = staffService.findById(id);
        return Result.success(staff);
    }

    @GetMapping("/page")
    public Result<Page<Staff>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String staffType,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String workStatus,
            @RequestParam(required = false) Long orgId) {
        Page<Staff> result = staffService.findPage(page, size, name, staffType, department, workStatus, orgId);
        return Result.success(result);
    }
}