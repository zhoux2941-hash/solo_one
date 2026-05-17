package com.pumpstation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PumpMonitoringApplication {
    public static void main(String[] args) {
        SpringApplication.run(PumpMonitoringApplication.class, args);
    }
}
