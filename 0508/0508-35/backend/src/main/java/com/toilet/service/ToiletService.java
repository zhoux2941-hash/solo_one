package com.toilet.service;

import com.toilet.entity.Toilet;
import com.toilet.entity.ToiletStall;
import com.toilet.repository.ToiletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ToiletService {
    private static final Logger logger = LoggerFactory.getLogger(ToiletService.class);

    @Autowired
    private ToiletRepository toiletRepository;

    private final Random random = new Random();

    @PostConstruct
    @Transactional
    public void initData() {
        if (toiletRepository.count() > 0) {
            logger.info("公厕数据已存在，跳过初始化");
            return;
        }

        logger.info("开始初始化公厕数据...");

        String[] toiletCodes = {"WC01", "WC02", "WC03", "WC04", "WC05", "WC06"};
        String[] stallCodes = {"A", "B", "C"};
        String[] locations = {
                "公园东门入口处",
                "公园中心广场旁",
                "公园西区花园",
                "公园北区湖边",
                "公园南区游乐场",
                "公园西门出口处"
        };

        for (int i = 0; i < toiletCodes.length; i++) {
            Toilet toilet = new Toilet();
            toilet.setCode(toiletCodes[i]);
            toilet.setName("公厕 " + toiletCodes[i]);
            toilet.setLocation(locations[i]);

            List<ToiletStall> stalls = new ArrayList<>();
            for (String stallCode : stallCodes) {
                ToiletStall stall = new ToiletStall();
                stall.setCode(stallCode);
                stall.setName("厕位 " + stallCode);
                stall.setPaperLevel(generateInitialPaperLevel());
                stall.setLastUpdate(LocalDateTime.now());
                stall.setToilet(toilet);
                stalls.add(stall);
            }
            toilet.setStalls(stalls);
            toiletRepository.save(toilet);
        }

        logger.info("公厕数据初始化完成，共 {} 个公厕", toiletCodes.length);
    }

    private int generateInitialPaperLevel() {
        return 60 + random.nextInt(41);
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void updatePaperLevels() {
        List<Toilet> toilets = toiletRepository.findAll();
        if (toilets.isEmpty()) {
            return;
        }

        boolean isWeekend = isWeekend(LocalDateTime.now());
        logger.debug("定时更新厕纸余量 - 周末: {}", isWeekend);

        for (Toilet toilet : toilets) {
            for (ToiletStall stall : toilet.getStalls()) {
                int currentLevel = stall.getPaperLevel();
                
                if (currentLevel <= 0) {
                    if (random.nextDouble() < 0.1) {
                        stall.setPaperLevel(generateInitialPaperLevel());
                        logger.info("{} 的厕位 {} 换纸完成，新余量: {}", toilet.getCode(), stall.getCode(), stall.getPaperLevel());
                    }
                    continue;
                }

                int consumption = calculateConsumption(isWeekend);
                int newLevel = Math.max(0, currentLevel - consumption);
                stall.setPaperLevel(newLevel);
                stall.setLastUpdate(LocalDateTime.now());
            }
            toiletRepository.save(toilet);
        }
    }

    private int calculateConsumption(boolean isWeekend) {
        double baseRate = 2;
        if (isWeekend) {
            baseRate = 5;
        }
        
        int randomFactor = random.nextInt(3);
        return (int) Math.round(baseRate + randomFactor);
    }

    private boolean isWeekend(LocalDateTime dateTime) {
        DayOfWeek day = dateTime.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    public List<Map<String, Object>> getAllToiletsWithLevels() {
        List<Toilet> toilets = toiletRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Toilet toilet : toilets) {
            Map<String, Object> toiletMap = new LinkedHashMap<>();
            toiletMap.put("id", toilet.getId());
            toiletMap.put("code", toilet.getCode());
            toiletMap.put("name", toilet.getName());
            toiletMap.put("location", toilet.getLocation());

            List<Map<String, Object>> cubicles = new ArrayList<>();
            for (ToiletStall stall : toilet.getStalls()) {
                Map<String, Object> stallMap = new LinkedHashMap<>();
                stallMap.put("id", stall.getId());
                stallMap.put("code", stall.getCode());
                stallMap.put("name", stall.getName());
                stallMap.put("paperLevel", stall.getPaperLevel());
                stallMap.put("lastUpdate", stall.getLastUpdate());
                cubicles.add(stallMap);
            }
            toiletMap.put("cubicles", cubicles);
            result.add(toiletMap);
        }

        return result;
    }
}
