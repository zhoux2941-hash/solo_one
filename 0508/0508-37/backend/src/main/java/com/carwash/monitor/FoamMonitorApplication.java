package com.carwash.monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoamMonitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoamMonitorApplication.class, args);
    }
}
