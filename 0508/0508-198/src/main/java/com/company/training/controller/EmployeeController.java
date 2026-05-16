package com.company.training.controller;

import com.company.training.entity.Employee;
import com.company.training.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllEmployees() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Employee> employees = employeeService.getAllEmployees();
            response.put("success", true);
            response.put("data", employees);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEmployeeById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            return employeeService.getEmployeeById(id)
                    .map(employee -> {
                        response.put("success", true);
                        response.put("data", employee);
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/no/{employeeNo}")
    public ResponseEntity<Map<String, Object>> getEmployeeByNo(@PathVariable String employeeNo) {
        Map<String, Object> response = new HashMap<>();
        try {
            return employeeService.getEmployeeByNo(employeeNo)
                    .map(employee -> {
                        response.put("success", true);
                        response.put("data", employee);
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEmployee(@Valid @RequestBody Employee employee) {
        Map<String, Object> response = new HashMap<>();
        try {
            Employee createdEmployee = employeeService.createEmployee(employee);
            response.put("success", true);
            response.put("message", "员工创建成功");
            response.put("data", createdEmployee);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEmployee(@PathVariable Long id, @Valid @RequestBody Employee employeeDetails) {
        Map<String, Object> response = new HashMap<>();
        try {
            Employee updatedEmployee = employeeService.updateEmployee(id, employeeDetails);
            response.put("success", true);
            response.put("message", "员工信息更新成功");
            response.put("data", updatedEmployee);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
