package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.Employee;
import com.scenic.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @PostMapping
    public Result<Employee> save(@RequestBody Employee employee) {
        Map<String, Object> result = employeeService.save(employee);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (Employee) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Map<String, Object> result = employeeService.delete(id);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), null);
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/{id}")
    public Result<Employee> getById(@PathVariable Long id) {
        return employeeService.findById(id)
                .map(Result::success)
                .orElse(Result.error("员工不存在"));
    }

    @GetMapping("/list")
    public Result<List<Employee>> list() {
        return Result.success(employeeService.findAll());
    }

    @GetMapping("/department/{departmentId}")
    public Result<List<Employee>> getByDepartment(@PathVariable Long departmentId) {
        return Result.success(employeeService.findByDepartment(departmentId));
    }

    @GetMapping("/page")
    public Result<Page<Employee>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        return Result.success(employeeService.findByPage(keyword, departmentId, status, pageable));
    }
}
