package com.astronomy.variablestar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class VariableStarObsApplication {
    public static void main(String[] args) {
        SpringApplication.run(VariableStarObsApplication.class, args);
    }
}
