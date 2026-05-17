package com.water.config;

import com.water.entity.User;
import com.water.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("admin123");
            admin.setRealName("系统管理员");
            admin.setPhone("13800138000");
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("inspector")) {
            User inspector = new User();
            inspector.setUsername("inspector");
            inspector.setPassword("123456");
            inspector.setRealName("巡检员张三");
            inspector.setPhone("13800138001");
            inspector.setRole("INSPECTOR");
            inspector.setEnabled(true);
            userRepository.save(inspector);
        }

        if (!userRepository.existsByUsername("staff")) {
            User staff = new User();
            staff.setUsername("staff");
            staff.setPassword("123456");
            staff.setRealName("普通员工李四");
            staff.setPhone("13800138002");
            staff.setRole("STAFF");
            staff.setEnabled(true);
            userRepository.save(staff);
        }
    }
}
