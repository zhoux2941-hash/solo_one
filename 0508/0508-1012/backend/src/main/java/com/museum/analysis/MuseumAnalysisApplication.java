package com.museum.analysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MuseumAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MuseumAnalysisApplication.class, args);
    }
}
