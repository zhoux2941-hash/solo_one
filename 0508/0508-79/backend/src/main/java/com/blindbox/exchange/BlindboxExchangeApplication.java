package com.blindbox.exchange;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BlindboxExchangeApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlindboxExchangeApplication.class, args);
    }
}
