package com.dubbing;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.dubbing.mapper")
public class DubbingApplication {
    public static void main(String[] args) {
        SpringApplication.run(DubbingApplication.class, args);
    }
}
