package com.museum.humidity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HumidityControlApplication {
    public static void main(String[] args) {
        SpringApplication.run(HumidityControlApplication.class, args);
    }
}
