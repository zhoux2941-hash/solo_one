package com.meteor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MeteorSpectraApplication {
    public static void main(String[] args) {
        SpringApplication.run(MeteorSpectraApplication.class, args);
    }
}
