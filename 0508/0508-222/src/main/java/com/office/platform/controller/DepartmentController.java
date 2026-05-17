package com.office.platform.controller;

import com.office.platform.common.Result;
import com.office.platform.dto.DepartmentDTO;
import com.office.platform.entity.Department;
import com.office.platform.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public Result<Page<Department>> getDepartmentList(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Department> departmentPage = departmentService.getDepartmentList(name, page, size);
        return Result.success(departmentPage);
    }

    @GetMapping("/enabled")
    public Result<List<Department>> getEnabledDepartments() {
        List<Department> departments = departmentService.getAllEnabledDepartments();
        return Result.success(departments);
    }

    @GetMapping("/{id}")
    public Result<Department> getDepartmentById(@PathVariable Long id) {
        Department department = departmentService.getDepartmentById(id);
        if (department == null) {
            return Result.error("部门不存在");
        }
        return Result.success(department);
    }

    @GetMapping("/{id}/detail")
    public Result<Map<String, Object>> getDepartmentDetail(@PathVariable Long id) {
        Map<String, Object> detail = departmentService.getDepartmentDetail(id);
        if (detail == null) {
            return Result.error("部门不存在");
        }
        return Result.success(detail);
    }

    @PostMapping
    public Result<Department> createDepartment(@Validated @RequestBody DepartmentDTO departmentDTO) {
        return departmentService.createDepartment(departmentDTO);
    }

    @PutMapping("/{id}")
    public Result<Department> updateDepartment(@PathVariable Long id, @Validated @RequestBody DepartmentDTO departmentDTO) {
        return departmentService.updateDepartment(id, departmentDTO);
    }

    @DeleteMapping("/{id}")
    public Result<String> deleteDepartment(@PathVariable Long id) {
        return departmentService.deleteDepartment(id);
    }

    @PutMapping("/{id}/status")
    public Result<String> toggleDepartmentStatus(@PathVariable Long id) {
        return departmentService.toggleDepartmentStatus(id);
    }
}