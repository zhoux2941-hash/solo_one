package com.opera.mask;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.opera.mask.mapper")
public class OperaMaskApplication {
    public static void main(String[] args) {
        SpringApplication.run(OperaMaskApplication.class, args);
    }
}
