package com.farm.silo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SiloMonitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(SiloMonitorApplication.class, args);
    }
}
