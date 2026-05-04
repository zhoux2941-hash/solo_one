package com.loganalysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 企业级日志分析系统主应用类
 */
@SpringBootApplication
@EnableScheduling
public class LogAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogAnalysisApplication.class, args);
    }
}
