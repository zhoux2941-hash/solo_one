package com.hrbonus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HrBonusApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrBonusApplication.class, args);
    }
}
