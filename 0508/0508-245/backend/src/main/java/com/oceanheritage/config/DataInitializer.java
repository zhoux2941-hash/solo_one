package com.oceanheritage.config;

import com.oceanheritage.entity.Coordinate;
import com.oceanheritage.entity.ProtectedArea;
import com.oceanheritage.repository.ProtectedAreaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProtectedAreaRepository protectedAreaRepository;

    @Override
    public void run(String... args) throws Exception {
        if (protectedAreaRepository.count() == 0) {
            ProtectedArea area1 = new ProtectedArea();
            area1.setName("东海文化遗产保护区A区");
            area1.setDescription("古代沉船遗址保护区");
            area1.setCoordinates(Arrays.asList(
                new Coordinate(121.80, 31.10),
                new Coordinate(121.95, 31.10),
                new Coordinate(121.95, 31.25),
                new Coordinate(121.80, 31.25),
                new Coordinate(121.80, 31.10)
            ));
            area1.setEnabled(true);
            protectedAreaRepository.save(area1);

            ProtectedArea area2 = new ProtectedArea();
            area2.setName("东海文化遗产保护区B区");
            area2.setDescription("水下考古重点区域");
            area2.setCoordinates(Arrays.asList(
                new Coordinate(121.85, 31.30),
                new Coordinate(122.00, 31.30),
                new Coordinate(122.00, 31.45),
                new Coordinate(121.85, 31.45),
                new Coordinate(121.85, 31.30)
            ));
            area2.setEnabled(true);
            protectedAreaRepository.save(area2);
        }
    }
}
