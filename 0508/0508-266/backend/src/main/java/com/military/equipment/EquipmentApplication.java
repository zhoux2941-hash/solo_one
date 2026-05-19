package com.military.equipment;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@MapperScan("com.military.equipment.mapper")
@EnableAspectJAutoProxy
public class EquipmentApplication {
    public static void main(String[] args) {
        SpringApplication.run(EquipmentApplication.class, args);
    }
}
