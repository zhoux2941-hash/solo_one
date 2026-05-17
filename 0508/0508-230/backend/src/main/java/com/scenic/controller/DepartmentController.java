package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Department;
import com.scenic.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/department")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @PostMapping
    public Result<Department> save(@RequestBody Department department) {
        Map<String, Object> result = departmentService.save(department);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Department) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = departmentService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<Department> getById(@PathVariable Long id) {
        return departmentService.findById(id)
                .map(Result::success)
                .orElse(Result.error("部门不存在"));
    }

    @GetMapping("/list")
    public Result<List<Department>> list() {
        return Result.success(departmentService.findAll());
    }

    @GetMapping("/active")
    public Result<List<Department>> active() {
        return Result.success(departmentService.findActive());
    }

    @GetMapping("/page")
    public Result<Page<Department>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("sortOrder").ascending().and(Sort.by("id").descending()));
        return Result.success(departmentService.findByPage(keyword, pageable));
    }
}
