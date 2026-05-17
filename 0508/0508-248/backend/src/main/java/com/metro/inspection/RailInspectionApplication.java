package com.metro.inspection;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RailInspectionApplication {

    public static void main(String[] args) {
        SpringApplication.run(RailInspectionApplication.class, args);
        System.out.println("============================================");
        System.out.println("  地铁轨道探伤车检测报告智能分析系统启动成功！");
        System.out.println("  后端服务: http://localhost:8080");
        System.out.println("  H2控制台: http://localhost:8080/h2-console");
        System.out.println("============================================");
    }
}
