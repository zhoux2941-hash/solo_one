package com.logistics.track;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrackSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrackSystemApplication.class, args);
    }
}
