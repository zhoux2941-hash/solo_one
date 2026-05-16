package com.hrbonus.config;

import com.hrbonus.entity.Department;
import com.hrbonus.entity.User;
import com.hrbonus.repository.DepartmentRepository;
import com.hrbonus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) {
        Department dept1 = new Department();
        dept1.setName("技术部");
        dept1.setDescription("负责技术开发和维护");
        dept1 = departmentRepository.save(dept1);

        Department dept2 = new Department();
        dept2.setName("市场部");
        dept2.setDescription("负责市场推广和销售");
        departmentRepository.save(dept2);

        User hr = new User();
        hr.setUsername("hr");
        hr.setPassword("123456");
        hr.setName("HR管理员");
        hr.setEmail("hr@company.com");
        hr.setDepartmentId(dept1.getId());
        hr.setRole(User.Role.HR);
        userRepository.save(hr);

        User manager1 = new User();
        manager1.setUsername("manager1");
        manager1.setPassword("123456");
        manager1.setName("张经理");
        manager1.setEmail("zhang@company.com");
        manager1.setDepartmentId(dept1.getId());
        manager1.setRole(User.Role.MANAGER);
        userRepository.save(manager1);

        dept1.setManagerId(manager1.getId());
        departmentRepository.save(dept1);

        for (int i = 1; i <= 5; i++) {
            User employee = new User();
            employee.setUsername("employee" + i);
            employee.setPassword("123456");
            employee.setName("员工" + i);
            employee.setEmail("employee" + i + "@company.com");
            employee.setDepartmentId(dept1.getId());
            employee.setRole(User.Role.EMPLOYEE);
            userRepository.save(employee);
        }
    }
}
