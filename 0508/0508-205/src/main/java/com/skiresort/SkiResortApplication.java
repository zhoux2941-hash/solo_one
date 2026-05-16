package com.skiresort;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkiResortApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkiResortApplication.class, args);
    }
}
