package com.swimming.lanematcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LaneMatcherApplication {
    public static void main(String[] args) {
        SpringApplication.run(LaneMatcherApplication.class, args);
    }
}