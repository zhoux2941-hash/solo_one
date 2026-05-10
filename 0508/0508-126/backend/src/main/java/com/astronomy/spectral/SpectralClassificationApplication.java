package com.astronomy.spectral;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SpectralClassificationApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpectralClassificationApplication.class, args);
    }
}
