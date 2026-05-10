package com.factory.materialcheck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MaterialCheckApplication {
    public static void main(String[] args) {
        SpringApplication.run(MaterialCheckApplication.class, args);
    }
}
