package com.office.platform.config;

import com.office.platform.entity.Department;
import com.office.platform.entity.Role;
import com.office.platform.entity.User;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.UserRepository;
import com.office.platform.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (departmentRepository.count() == 0) {
            Department dept1 = new Department();
            dept1.setName("技术部");
            dept1.setDescription("负责技术开发和系统维护");
            dept1.setEnabled(true);
            departmentRepository.save(dept1);

            Department dept2 = new Department();
            dept2.setName("人事部");
            dept2.setDescription("负责人力资源管理");
            dept2.setEnabled(true);
            departmentRepository.save(dept2);

            Department dept3 = new Department();
            dept3.setName("财务部");
            dept3.setDescription("负责财务管理");
            dept3.setEnabled(true);
            departmentRepository.save(dept3);
        }

        if (userRepository.count() == 0) {
            Department techDept = departmentRepository.findById(1L).orElse(null);

            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(PasswordEncoder.encode("admin123"));
            admin.setRealName("系统管理员");
            admin.setPhone("13800000000");
            admin.setEmail("admin@company.com");
            admin.setRole(Role.ADMIN);
            admin.setDepartment(techDept);
            admin.setEnabled(true);
            userRepository.save(admin);

            User employee1 = new User();
            employee1.setUsername("zhangsan");
            employee1.setPassword(PasswordEncoder.encode("123456"));
            employee1.setRealName("张三");
            employee1.setPhone("13800000001");
            employee1.setEmail("zhangsan@company.com");
            employee1.setRole(Role.EMPLOYEE);
            employee1.setDepartment(techDept);
            employee1.setEnabled(true);
            userRepository.save(employee1);

            User employee2 = new User();
            employee2.setUsername("lisi");
            employee2.setPassword(PasswordEncoder.encode("123456"));
            employee2.setRealName("李四");
            employee2.setPhone("13800000002");
            employee2.setEmail("lisi@company.com");
            employee2.setRole(Role.EMPLOYEE);
            employee2.setDepartment(techDept);
            employee2.setEnabled(true);
            userRepository.save(employee2);
        }
    }
}