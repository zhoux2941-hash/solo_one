package com.petclean;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PetCleanApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetCleanApplication.class, args);
    }
}
