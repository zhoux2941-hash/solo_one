package com.cinema.popcorn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class PopcornOptimizerApplication {
    public static void main(String[] args) {
        SpringApplication.run(PopcornOptimizerApplication.class, args);
    }
}
