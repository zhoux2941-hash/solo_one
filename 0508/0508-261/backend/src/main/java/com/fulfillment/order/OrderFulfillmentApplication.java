package com.fulfillment.order;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.fulfillment.order.mapper")
public class OrderFulfillmentApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderFulfillmentApplication.class, args);
    }
}