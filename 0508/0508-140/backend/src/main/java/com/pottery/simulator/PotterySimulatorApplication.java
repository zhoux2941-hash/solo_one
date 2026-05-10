package com.pottery.simulator;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.pottery.simulator.repository")
public class PotterySimulatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(PotterySimulatorApplication.class, args);
    }

}
