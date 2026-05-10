package com.studentunion.budgetmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class BudgetManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetManagementApplication.class, args);
    }
}
