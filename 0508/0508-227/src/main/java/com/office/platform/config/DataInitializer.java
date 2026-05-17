package com.office.platform.config;

import com.office.platform.entity.Department;
import com.office.platform.entity.Employee;
import com.office.platform.entity.Position;
import com.office.platform.entity.Role;
import com.office.platform.entity.User;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.EmployeeRepository;
import com.office.platform.repository.PositionRepository;
import com.office.platform.repository.UserRepository;
import com.office.platform.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PositionRepository positionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

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

        if (positionRepository.count() == 0) {
            Department techDept = departmentRepository.findById(1L).orElse(null);
            Department hrDept = departmentRepository.findById(2L).orElse(null);

            Position pos1 = new Position();
            pos1.setName("高级开发工程师");
            pos1.setLevel("高级");
            pos1.setDepartment(techDept);
            pos1.setDescription("负责核心系统开发和技术架构设计");
            pos1.setEnabled(true);
            positionRepository.save(pos1);

            Position pos2 = new Position();
            pos2.setName("初级开发工程师");
            pos2.setLevel("初级");
            pos2.setDepartment(techDept);
            pos2.setDescription("负责功能模块开发和维护");
            pos2.setEnabled(true);
            positionRepository.save(pos2);

            Position pos3 = new Position();
            pos3.setName("HR专员");
            pos3.setLevel("中级");
            pos3.setDepartment(hrDept);
            pos3.setDescription("负责招聘、员工关系管理");
            pos3.setEnabled(true);
            positionRepository.save(pos3);
        }

        if (employeeRepository.count() == 0) {
            Department techDept = departmentRepository.findById(1L).orElse(null);
            Position seniorDev = positionRepository.findById(1L).orElse(null);
            Position juniorDev = positionRepository.findById(2L).orElse(null);
            User userZhangsan = userRepository.findById(2L).orElse(null);
            User userLisi = userRepository.findById(3L).orElse(null);

            Employee emp1 = new Employee();
            emp1.setName("张三");
            emp1.setIdCard("110101199001011234");
            emp1.setPhone("13800000001");
            emp1.setEmail("zhangsan@company.com");
            emp1.setEntryDate(LocalDate.of(2022, 3, 15));
            emp1.setEducation("本科");
            emp1.setEmergencyContact("张夫人");
            emp1.setEmergencyPhone("13900000001");
            emp1.setDepartment(techDept);
            emp1.setPosition(seniorDev);
            emp1.setUser(userZhangsan);
            emp1.setEnabled(true);
            employeeRepository.save(emp1);

            Employee emp2 = new Employee();
            emp2.setName("李四");
            emp2.setIdCard("110101199205155678");
            emp2.setPhone("13800000002");
            emp2.setEmail("lisi@company.com");
            emp2.setEntryDate(LocalDate.of(2023, 1, 10));
            emp2.setEducation("硕士");
            emp2.setEmergencyContact("李夫人");
            emp2.setEmergencyPhone("13900000002");
            emp2.setDepartment(techDept);
            emp2.setPosition(juniorDev);
            emp2.setUser(userLisi);
            emp2.setEnabled(true);
            employeeRepository.save(emp2);

            Employee emp3 = new Employee();
            emp3.setName("王五");
            emp3.setIdCard("110101198808089012");
            emp3.setPhone("13800000003");
            emp3.setEmail("wangwu@company.com");
            emp3.setEntryDate(LocalDate.of(2021, 6, 1));
            emp3.setEducation("本科");
            emp3.setEmergencyContact("王夫人");
            emp3.setEmergencyPhone("13900000003");
            emp3.setDepartment(techDept);
            emp3.setPosition(seniorDev);
            emp3.setEnabled(true);
            employeeRepository.save(emp3);
        }
    }
}