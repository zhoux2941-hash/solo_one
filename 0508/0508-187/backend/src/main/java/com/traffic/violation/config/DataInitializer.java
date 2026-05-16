package com.traffic.violation.config;

import com.traffic.violation.entity.User;
import com.traffic.violation.entity.Violation;
import com.traffic.violation.repository.UserRepository;
import com.traffic.violation.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ViolationRepository violationRepository;

    @Override
    public void run(String... args) throws Exception {
        User police = new User();
        police.setUsername("police");
        police.setPassword("123456");
        police.setName("张警官");
        police.setPlateNumber("");
        police.setPhone("13800138000");
        police.setRole("POLICE");
        userRepository.save(police);

        User user1 = new User();
        user1.setUsername("zhangsan");
        user1.setPassword("123456");
        user1.setName("张三");
        user1.setPlateNumber("粤A12345");
        user1.setPhone("13900139001");
        user1.setRole("OWNER");
        userRepository.save(user1);

        User user2 = new User();
        user2.setUsername("lisi");
        user2.setPassword("123456");
        user2.setName("李四");
        user2.setPlateNumber("粤B67890");
        user2.setPhone("13900139002");
        user2.setRole("OWNER");
        userRepository.save(user2);

        Violation v1 = new Violation();
        v1.setPlateNumber("粤A12345");
        v1.setViolationTime(LocalDateTime.now().minusDays(5));
        v1.setLocation("广州市天河区体育西路");
        v1.setFineAmount(new BigDecimal("200.00"));
        v1.setPoints(3);
        v1.setStatus("UNPAID");
        violationRepository.save(v1);

        Violation v2 = new Violation();
        v2.setPlateNumber("粤A12345");
        v2.setViolationTime(LocalDateTime.now().minusDays(10));
        v2.setLocation("广州市越秀区北京路");
        v2.setFineAmount(new BigDecimal("100.00"));
        v2.setPoints(2);
        v2.setStatus("UNPAID");
        violationRepository.save(v2);

        Violation v3 = new Violation();
        v3.setPlateNumber("粤B67890");
        v3.setViolationTime(LocalDateTime.now().minusDays(3));
        v3.setLocation("深圳市南山区科技园");
        v3.setFineAmount(new BigDecimal("500.00"));
        v3.setPoints(6);
        v3.setStatus("UNPAID");
        violationRepository.save(v3);

        System.out.println("========================================");
        System.out.println("数据初始化完成！");
        System.out.println("交警账号: police / 123456");
        System.out.println("车主账号1: zhangsan / 123456 (车牌: 粤A12345)");
        System.out.println("车主账号2: lisi / 123456 (车牌: 粤B67890)");
        System.out.println("========================================");
    }
}
