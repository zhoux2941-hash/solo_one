package com.loker.cabinet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CabinetApplication {
    public static void main(String[] args) {
        SpringApplication.run(CabinetApplication.class, args);
    }
}
