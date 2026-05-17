package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Employee;
import com.factory.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping("/page")
    public Result<Page<Employee>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return employeeService.findAll(page, size, keyword);
    }

    @GetMapping("/team/{teamId}")
    public Result<List<Employee>> findByTeamId(@PathVariable Long teamId) {
        return employeeService.findByTeamId(teamId);
    }

    @GetMapping("/{id}")
    public Result<Employee> findById(@PathVariable Long id) {
        return employeeService.findById(id);
    }

    @PostMapping
    public Result<Employee> save(@RequestBody Employee employee) {
        return employeeService.save(employee);
    }

    @PutMapping("/{id}")
    public Result<Employee> update(@PathVariable Long id, @RequestBody Employee employee) {
        return employeeService.update(id, employee);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return employeeService.delete(id);
    }
}