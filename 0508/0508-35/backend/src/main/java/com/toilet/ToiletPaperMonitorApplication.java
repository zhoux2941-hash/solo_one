package com.toilet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ToiletPaperMonitorApplication {
    public static void main(String[] args) {
        SpringApplication.run(ToiletPaperMonitorApplication.class, args);
    }
}
