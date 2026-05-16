package com.cafeteria.controller;

import com.cafeteria.entity.ConsumptionRecord;
import com.cafeteria.entity.Employee;
import com.cafeteria.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "*")
public class EmployeeController {
    
    @Autowired
    private EmployeeService employeeService;
    
    @GetMapping("/{employeeId}")
    public ResponseEntity<?> getEmployee(@PathVariable String employeeId) {
        Employee employee = employeeService.getEmployeeByEmployeeId(employeeId);
        if (employee == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "员工不存在"));
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("employeeId", employee.getEmployeeId());
        result.put("name", employee.getName());
        result.put("email", employee.getEmail());
        result.put("balance", employee.getBalance());
        
        double dailyTotal = employeeService.getDailyTotal(employeeId);
        result.put("dailyTotal", dailyTotal);
        result.put("lowBalanceWarning", employee.getBalance() < 50);
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/consume")
    public ResponseEntity<?> consume(@RequestBody Map<String, Object> request) {
        try {
            String employeeId = (String) request.get("employeeId");
            double amount = Double.parseDouble(request.get("amount").toString());
            String windowNumber = (String) request.get("windowNumber");
            
            if (amount <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "消费金额必须大于0"));
            }
            
            double dailyTotal = employeeService.getDailyTotal(employeeId);
            
            ConsumptionRecord record = employeeService.consume(employeeId, amount, windowNumber);
            
            Employee employee = employeeService.getEmployeeByEmployeeId(employeeId);
            
            boolean needsConfirmation = (dailyTotal + amount) > 50;
            
            if (employee.getBalance() < 50) {
                employeeService.sendLowBalanceEmail(employee);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("newBalance", employee.getBalance());
            result.put("needsConfirmation", needsConfirmation);
            result.put("lowBalanceWarning", employee.getBalance() < 50);
            result.put("dailyTotal", dailyTotal + amount);
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{employeeId}/history")
    public ResponseEntity<?> getConsumptionHistory(@PathVariable String employeeId,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Page<ConsumptionRecord> records = 
            employeeService.getConsumptionHistoryPage(employeeId, page, size);
        
        Map<String, Object> result = new HashMap<>();
        result.put("content", records.getContent());
        result.put("totalPages", records.getTotalPages());
        result.put("totalElements", records.getTotalElements());
        result.put("currentPage", records.getNumber());
        result.put("pageSize", records.getSize());
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/create")
    public ResponseEntity<?> createEmployee(@RequestBody Map<String, String> request) {
        try {
            String employeeId = request.get("employeeId");
            String name = request.get("name");
            String email = request.get("email");
            
            Employee employee = employeeService.createEmployee(employeeId, name, email);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("employeeId", employee.getEmployeeId());
            result.put("name", employee.getName());
            result.put("balance", employee.getBalance());
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<?> getAllEmployees() {
        List<Employee> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }
}
