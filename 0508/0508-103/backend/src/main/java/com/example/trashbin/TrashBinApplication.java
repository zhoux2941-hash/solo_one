package com.example.trashbin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.trashbin.mapper")
public class TrashBinApplication {
    public static void main(String[] args) {
        SpringApplication.run(TrashBinApplication.class, args);
    }
}
