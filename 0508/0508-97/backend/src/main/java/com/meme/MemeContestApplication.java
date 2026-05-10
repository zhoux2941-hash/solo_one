package com.meme;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.meme.mapper")
public class MemeContestApplication {

    public static void main(String[] args) {
        SpringApplication.run(MemeContestApplication.class, args);
    }
}
