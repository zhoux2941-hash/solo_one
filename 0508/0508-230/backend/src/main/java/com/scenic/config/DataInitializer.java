package com.scenic.config;

import com.scenic.entity.User;
import com.scenic.repository.UserRepository;
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
            admin.setRole("ADMIN");
            admin.setStatus(true);
            userRepository.save(admin);
            System.out.println("默认管理员用户已创建: admin/admin123");
        }
    }
}
