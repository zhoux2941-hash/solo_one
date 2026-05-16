package com.cafeteria.config;

import com.cafeteria.entity.Employee;
import com.cafeteria.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.YearMonth;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (employeeRepository.count() == 0) {
            employeeRepository.save(new Employee("E001", "张三", "zhangsan@example.com", 500.0));
            employeeRepository.save(new Employee("E002", "李四", "lisi@example.com", 500.0));
            employeeRepository.save(new Employee("E003", "王五", "wangwu@example.com", 500.0));
            
            employeeRepository.findAll().forEach(emp -> {
                emp.setLastMonth(YearMonth.now().toString());
                employeeRepository.save(emp);
            });
            
            System.out.println("========================================");
            System.out.println("初始员工数据已创建:");
            System.out.println("E001 - 张三 - zhangsan@example.com");
            System.out.println("E002 - 李四 - lisi@example.com");
            System.out.println("E003 - 王五 - wangwu@example.com");
            System.out.println("每位员工初始餐补: 500元");
            System.out.println("========================================");
        }
    }
}
