package com.exoplanet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TransitSimulatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransitSimulatorApplication.class, args);
    }
}