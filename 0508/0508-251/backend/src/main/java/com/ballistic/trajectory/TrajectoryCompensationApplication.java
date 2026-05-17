package com.ballistic.trajectory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TrajectoryCompensationApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrajectoryCompensationApplication.class, args);
        System.out.println("================================================");
        System.out.println("  山地复杂地形弹道补偿计算平台 - 后端服务启动成功");
        System.out.println("  访问地址: http://localhost:8080");
        System.out.println("  H2控制台: http://localhost:8080/h2-console");
        System.out.println("================================================");
    }
}
