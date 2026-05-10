package com.exoplanet.service;

import com.exoplanet.entity.StarTemplate;
import com.exoplanet.repository.StarTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StarTemplateService {

    private final StarTemplateRepository starTemplateRepository;

    @PostConstruct
    public void init() {
        if (starTemplateRepository.count() == 0) {
            log.info("Initializing star templates...");
            createDefaultTemplates();
        }
    }

    @Cacheable(value = "starTemplates", key = "'all'")
    public List<StarTemplate> getAllTemplates() {
        return starTemplateRepository.findAll();
    }

    private void createDefaultTemplates() {
        List<StarTemplate> templates = List.of(
            createTemplate("太阳 (G2V)", 1.0, 5778.0, "我们的太阳，G型主序星，表面温度约5778K"),
            createTemplate("天狼星A (A1V)", 1.711, 9940.0, "夜空中最亮的恒星，A型主序星"),
            createTemplate("织女星 (A0V)", 2.362, 9602.0, "著名的蓝白色主序星，A0V型"),
            createTemplate("比邻星 (M5.5Ve)", 0.1542, 3042.0, "距离太阳最近的恒星，红矮星"),
            createTemplate("参宿四 (M2Iab)", 887.0, 3500.0, "红超巨星，猎户座中最亮的恒星之一"),
            createTemplate("北极星 (F7Ib)", 37.5, 6015.0, "黄超巨星，著名的造父变星"),
            createTemplate("参宿七 (B8Ia)", 78.9, 12100.0, "蓝超巨星，猎户座中的明亮恒星"),
            createTemplate("心宿二 (M1.5Iab-Ib)", 680.0, 3570.0, "红超巨星，天蝎座中最亮的恒星")
        );

        starTemplateRepository.saveAll(templates);
        log.info("Created {} star templates", templates.size());
    }

    private StarTemplate createTemplate(String name, double radius, double temperature, String description) {
        StarTemplate template = new StarTemplate();
        template.setName(name);
        template.setRadius(radius);
        template.setTemperature(temperature);
        template.setDescription(description);
        return template;
    }
}