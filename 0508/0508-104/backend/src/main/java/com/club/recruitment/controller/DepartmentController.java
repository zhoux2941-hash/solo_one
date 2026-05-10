package com.club.recruitment.controller;

import com.club.recruitment.dto.DepartmentRequest;
import com.club.recruitment.entity.Department;
import com.club.recruitment.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        Department department = departmentService.createDepartment(request);
        return ResponseEntity.ok(department);
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @GetMapping("/{id}/assigned-count")
    public ResponseEntity<Long> getAssignedCount(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getAssignedCountFromRedis(id));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSlots(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getAvailableSlotsWithCapacity(id));
    }
}