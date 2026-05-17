package com.factory.config;

import com.factory.entity.User;
import com.factory.repository.UserRepository;
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
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            userRepository.save(admin);
            System.out.println("默认管理员用户已创建: admin/admin123");
        }
    }
}