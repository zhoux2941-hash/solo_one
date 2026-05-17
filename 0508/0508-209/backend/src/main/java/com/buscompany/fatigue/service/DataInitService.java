package com.buscompany.fatigue.service;

import com.buscompany.fatigue.entity.Driver;
import com.buscompany.fatigue.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class DataInitService implements CommandLineRunner {
    @Autowired
    private DriverRepository driverRepository;

    @Override
    public void run(String... args) throws Exception {
        if (driverRepository.count() == 0) {
            String[][] driverData = {
                {"D001", "张明", "13800138001", "京A12345", "1路"},
                {"D002", "李强", "13800138002", "京A12346", "2路"},
                {"D003", "王芳", "13800138003", "京A12347", "3路"},
                {"D004", "刘洋", "13800138004", "京A12348", "4路"},
                {"D005", "陈静", "13800138005", "京A12349", "5路"},
                {"D006", "赵伟", "13800138006", "京A12350", "6路"},
                {"D007", "孙丽", "13800138007", "京A12351", "7路"},
                {"D008", "周杰", "13800138008", "京A12352", "8路"}
            };

            for (String[] data : driverData) {
                Driver driver = new Driver();
                driver.setDriverNo(data[0]);
                driver.setName(data[1]);
                driver.setPhone(data[2]);
                driver.setBusNo(data[3]);
                driver.setRoute(data[4]);
                driver.setOnline(false);
                driver.setCreateTime(LocalDateTime.now());
                driverRepository.save(driver);
            }

            System.out.println("初始化司机数据完成，共 " + driverData.length + " 名司机");
        }
    }
}
