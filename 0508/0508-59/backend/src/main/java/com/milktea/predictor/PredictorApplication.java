package com.milktea.predictor;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.milktea.predictor.mapper")
public class PredictorApplication {
    public static void main(String[] args) {
        SpringApplication.run(PredictorApplication.class, args);
    }
}
