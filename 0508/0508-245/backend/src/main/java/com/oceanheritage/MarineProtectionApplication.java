package com.oceanheritage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MarineProtectionApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarineProtectionApplication.class, args);
    }
}
