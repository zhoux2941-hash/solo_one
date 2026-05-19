package com.industrial.workorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WorkorderApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkorderApplication.class, args);
    }
}
