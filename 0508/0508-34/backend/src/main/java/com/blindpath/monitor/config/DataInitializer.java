package com.blindpath.monitor.config;

import com.blindpath.monitor.entity.DetectionPoint;
import com.blindpath.monitor.repository.DetectionPointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DetectionPointRepository detectionPointRepository;
    private final Random random = new Random(42);

    @Override
    public void run(String... args) {
        LocalDate today = LocalDate.now();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            if (!detectionPointRepository.existsByRecordDate(date)) {
                List<DetectionPoint> points = generateDailyData(date);
                detectionPointRepository.saveAll(points);
            }
        }
    }

    private List<DetectionPoint> generateDailyData(LocalDate date) {
        List<DetectionPoint> points = new ArrayList<>();
        int[] distances = {0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100};

        for (int distance : distances) {
            DetectionPoint point = new DetectionPoint();
            point.setDistance(distance);
            point.setWearDegree(generateWearDegree(distance));
            point.setRecordDate(date);
            points.add(point);
        }

        return points;
    }

    private int generateWearDegree(int distance) {
        int baseWear;
        if (distance <= 10 || distance >= 90) {
            baseWear = 70 + random.nextInt(26);
        } else if (distance <= 30 || distance >= 70) {
            baseWear = 50 + random.nextInt(21);
        } else if (distance == 50) {
            baseWear = 20 + random.nextInt(21);
        } else {
            baseWear = 30 + random.nextInt(21);
        }

        int dailyVariation = random.nextInt(11) - 5;
        int wear = baseWear + dailyVariation;
        wear = Math.max(0, Math.min(100, wear));
        return wear;
    }
}
