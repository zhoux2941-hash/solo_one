package com.charging;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChargingPileApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChargingPileApplication.class, args);
    }
}
