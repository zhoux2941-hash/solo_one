package com.driving;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.driving.mapper")
public class DrivingSchoolApplication {
    public static void main(String[] args) {
        SpringApplication.run(DrivingSchoolApplication.class, args);
    }
}