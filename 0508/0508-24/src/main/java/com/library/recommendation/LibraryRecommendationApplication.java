package com.library.recommendation;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.library.recommendation.mapper")
public class LibraryRecommendationApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryRecommendationApplication.class, args);
    }
}
