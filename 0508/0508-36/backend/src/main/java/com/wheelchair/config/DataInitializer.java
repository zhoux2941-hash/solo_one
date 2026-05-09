package com.wheelchair.config;

import com.wheelchair.entity.BrakeWearRecord;
import com.wheelchair.repository.BrakeWearRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BrakeWearRepository wearRepository;
    private final Random random = new Random(42);

    private static final String[] WHEELCHAIRS = {"W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"};

    @Override
    public void run(String... args) {
        log.info("开始初始化磨损历史数据...");
        initializeWearData();
        log.info("数据初始化完成！");
    }

    private void initializeWearData() {
        LocalDate today = LocalDate.of(2026, 5, 9);
        LocalDate twoMonthsAgo = today.minusMonths(2);
        
        List<BrakeWearRecord> records = new ArrayList<>();

        int[] baseWear = {15, 25, 35, 20, 45, 30, 55, 28};

        for (int w = 0; w < WHEELCHAIRS.length; w++) {
            String wheelchairId = WHEELCHAIRS[w];
            int wear = baseWear[w];
            
            LocalDate currentDate = twoMonthsAgo;
            while (!currentDate.isAfter(today)) {
                int dailyIncrease = random.nextInt(3) + 1;
                int randomVariation = random.nextInt(5) - 2;
                wear = wear + dailyIncrease + randomVariation;
                
                if (wear < 0) wear = 0;
                if (wear > 100) wear = 100;
                
                records.add(new BrakeWearRecord(null, wheelchairId, currentDate, wear));
                currentDate = currentDate.plusDays(1);
            }
        }

        wearRepository.saveAll(records);
        log.info("已生成 {} 条磨损历史记录", records.size());
    }
}
