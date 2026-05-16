package com.company.training;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TrainingPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrainingPlatformApplication.class, args);
        System.out.println("========================================");
        System.out.println("  培训平台启动成功！");
        System.out.println("  访问地址: http://localhost:8080");
        System.out.println("  H2控制台: http://localhost:8080/h2-console");
        System.out.println("========================================");
    }
}
