package com.buscompany.fatigue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FatigueMonitorApplication {
    public static void main(String[] args) {
        SpringApplication.run(FatigueMonitorApplication.class, args);
    }
}
