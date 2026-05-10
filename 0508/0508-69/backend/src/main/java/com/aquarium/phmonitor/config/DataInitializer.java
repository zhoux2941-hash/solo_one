package com.aquarium.phmonitor.config;

import com.aquarium.phmonitor.entity.PhRecord;
import com.aquarium.phmonitor.repository.PhRecordRepository;
import com.aquarium.phmonitor.service.PhRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PhRecordRepository phRecordRepository;

    @Autowired
    private PhRecordService phRecordService;

    private static final List<String> TANKS = Arrays.asList(
        "珊瑚缸", "鲨鱼缸", "热带鱼缸", "水母缸", "海龟缸", "企鹅缸", "海獭缸", "巨藻缸"
    );

    @Override
    public void run(String... args) {
        long count = phRecordRepository.count();
        if (count == 0) {
            initialize7DaysData();
        }
    }

    private void initialize7DaysData() {
        LocalDateTime endTime = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startTime = endTime.minusDays(7);
        
        List<PhRecord> allRecords = new ArrayList<>();
        int batchSize = 500;

        for (String tank : TANKS) {
            LocalDateTime current = startTime;
            while (current.isBefore(endTime)) {
                double ph = phRecordService.generateMockPhValue(tank);
                boolean abnormal = phRecordService.isPhAbnormal(ph);
                allRecords.add(new PhRecord(tank, ph, current, abnormal));

                if (allRecords.size() >= batchSize) {
                    phRecordRepository.saveAll(allRecords);
                    allRecords.clear();
                }

                current = current.plusHours(1);
            }
        }

        if (!allRecords.isEmpty()) {
            phRecordRepository.saveAll(allRecords);
        }

        System.out.println("7天模拟数据初始化完成，共插入 " + (7 * 24 * 8) + " 条记录");
    }
}
