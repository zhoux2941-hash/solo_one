package com.kindergarten.temperature.init;

import com.kindergarten.temperature.entity.Bed;
import com.kindergarten.temperature.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private BedRepository bedRepository;

    private static final String[] CHILD_NAMES = {
            "小明", "小红", "小刚", "小丽", "小华", "小芳",
            "小强", "小美", "小军", "小玲", "小亮", "小燕"
    };

    private static final String[] GENDERS = {
            "男", "女", "男", "女", "男", "女",
            "男", "女", "男", "女", "男", "女"
    };

    private static final int[] AGES = {4, 5, 4, 5, 3, 4, 5, 4, 3, 5, 4, 5};

    @Override
    public void run(String... args) {
        for (int i = 1; i <= 12; i++) {
            if (!bedRepository.existsByBedNo(i)) {
                Bed bed = new Bed();
                bed.setBedNo(i);
                bed.setChildName(CHILD_NAMES[i - 1]);
                bed.setGender(GENDERS[i - 1]);
                bed.setAge(AGES[i - 1]);
                bedRepository.save(bed);
            }
        }
    }
}
