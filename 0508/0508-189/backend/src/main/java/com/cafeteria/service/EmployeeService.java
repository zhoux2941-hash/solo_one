package com.cafeteria.service;

import com.cafeteria.entity.ConsumptionRecord;
import com.cafeteria.entity.Employee;
import com.cafeteria.repository.ConsumptionRecordRepository;
import com.cafeteria.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private ConsumptionRecordRepository consumptionRecordRepository;
    
    private static final double MONTHLY_ALLOWANCE = 500.0;
    
    public Employee getEmployeeByEmployeeId(String employeeId) {
        Optional<Employee> employeeOpt = employeeRepository.findByEmployeeId(employeeId);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            checkAndResetMonthlyAllowance(employee);
            return employee;
        }
        return null;
    }
    
    private void checkAndResetMonthlyAllowance(Employee employee) {
        String currentMonth = YearMonth.now().toString();
        if (!currentMonth.equals(employee.getLastMonth())) {
            employee.setBalance(MONTHLY_ALLOWANCE);
            employee.setLastMonth(currentMonth);
            employeeRepository.save(employee);
        }
    }
    
    @Transactional
    public ConsumptionRecord consume(String employeeId, double amount, String windowNumber) {
        Employee employee = getEmployeeByEmployeeId(employeeId);
        if (employee == null) {
            throw new RuntimeException("员工不存在");
        }
        
        if (employee.getBalance() < amount) {
            throw new RuntimeException("余额不足");
        }
        
        employee.setBalance(employee.getBalance() - amount);
        employeeRepository.save(employee);
        
        ConsumptionRecord record = new ConsumptionRecord(
            employeeId, 
            amount, 
            LocalDateTime.now(), 
            windowNumber
        );
        
        return consumptionRecordRepository.save(record);
    }
    
    public double getDailyTotal(String employeeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        
        return consumptionRecordRepository.getDailyTotalAmount(employeeId, startOfDay, endOfDay);
    }
    
    public List<ConsumptionRecord> getConsumptionHistory(String employeeId) {
        return consumptionRecordRepository.findByEmployeeIdOrderByConsumptionTimeDesc(employeeId);
    }
    
    public org.springframework.data.domain.Page<ConsumptionRecord> getConsumptionHistoryPage(String employeeId, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return consumptionRecordRepository.findByEmployeeIdOrderByConsumptionTimeDesc(employeeId, pageable);
    }
    
    public void sendLowBalanceEmail(Employee employee) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String currentTime = now.format(formatter);
        
        System.out.println("========================================");
        System.out.println("发送邮件模拟日志:");
        System.out.println("发送时间: " + currentTime);
        System.out.println("收件人: " + employee.getEmail());
        System.out.println("主题: 餐补余额不足提醒");
        System.out.println("内容: 尊敬的 " + employee.getName() + "，您的餐补余额已低于50元，");
        System.out.println("当前余额: " + String.format("%.2f", employee.getBalance()) + " 元");
        System.out.println("请及时关注您的消费情况。");
        System.out.println("========================================");
    }
    
    public Employee createEmployee(String employeeId, String name, String email) {
        if (employeeRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new RuntimeException("员工ID已存在");
        }
        
        Employee employee = new Employee(
            employeeId, 
            name, 
            email, 
            MONTHLY_ALLOWANCE
        );
        employee.setLastMonth(YearMonth.now().toString());
        return employeeRepository.save(employee);
    }
    
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }
}
