package com.office.platform.controller;

import com.office.platform.common.Result;
import com.office.platform.dto.EmployeeDTO;
import com.office.platform.entity.Employee;
import com.office.platform.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public Result<Page<Employee>> getEmployeeList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Employee> employeePage = employeeService.getEmployeeList(name, departmentId, positionId, page, size);
        return Result.success(employeePage);
    }

    @GetMapping("/{id}")
    public Result<Employee> getEmployeeById(@PathVariable Long id) {
        Employee employee = employeeService.getEmployeeById(id);
        if (employee == null) {
            return Result.error("员工档案不存在");
        }
        return Result.success(employee);
    }

    @GetMapping("/user/{userId}")
    public Result<Employee> getEmployeeByUserId(@PathVariable Long userId) {
        Employee employee = employeeService.getEmployeeByUserId(userId);
        return Result.success(employee);
    }

    @PostMapping
    public Result<Employee> createEmployee(@Validated @RequestBody EmployeeDTO employeeDTO) {
        return employeeService.createEmployee(employeeDTO);
    }

    @PutMapping("/{id}")
    public Result<Employee> updateEmployee(@PathVariable Long id, @Validated @RequestBody EmployeeDTO employeeDTO) {
        return employeeService.updateEmployee(id, employeeDTO);
    }

    @DeleteMapping("/{id}")
    public Result<String> deleteEmployee(@PathVariable Long id) {
        return employeeService.deleteEmployee(id);
    }
}
