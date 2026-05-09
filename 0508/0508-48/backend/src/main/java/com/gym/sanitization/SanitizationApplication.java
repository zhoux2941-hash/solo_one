package com.gym.sanitization;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SanitizationApplication {
    public static void main(String[] args) {
        SpringApplication.run(SanitizationApplication.class, args);
    }
}
