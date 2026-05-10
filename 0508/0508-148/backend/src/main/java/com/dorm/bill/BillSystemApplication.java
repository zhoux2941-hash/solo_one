package com.dorm.bill;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.dorm.bill.mapper")
public class BillSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(BillSystemApplication.class, args);
    }
}
