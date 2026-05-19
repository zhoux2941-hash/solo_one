package com.kindergarten.temperature.service;

import com.kindergarten.temperature.dto.TemperatureSnapshot;
import com.kindergarten.temperature.entity.TemperatureRecord;
import com.kindergarten.temperature.repository.TemperatureRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TemperatureSimulationService {

    @Value("${monitor.bed-count:12}")
    private int bedCount;

    @Value("${monitor.min-temperature:36.0}")
    private double minTemperature;

    @Value("${monitor.max-temperature:37.2}")
    private double maxTemperature;

    @Autowired
    private TemperatureDetectionService detectionService;

    @Autowired
    private TemperatureRecordRepository recordRepository;

    @Autowired
    private RedisSnapshotService snapshotService;

    @Autowired
    private SseService sseService;

    private final Random random = new Random();
    private final Map<Integer, Double> lastTemperatureMap = new ConcurrentHashMap<>();
    private boolean simulationRunning = false;

    @Scheduled(fixedRateString = "${monitor.simulate-interval:10000}")
    public void simulateTemperatureReading() {
        if (!simulationRunning) {
            return;
        }
        for (int bedNo = 1; bedNo <= bedCount; bedNo++) {
            double temperature = generateTemperature(bedNo);
            TemperatureRecord record = detectionService.detectAndSave(bedNo, temperature);
            lastTemperatureMap.put(bedNo, temperature);

            TemperatureSnapshot snapshot = snapshotService.getSnapshot(bedNo);
            if (snapshot != null) {
                sseService.sendTemperatureUpdate(snapshot);
            }
        }
    }

    private double generateTemperature(int bedNo) {
        Double lastTemp = lastTemperatureMap.get(bedNo);
        double baseTemp;

        if (lastTemp == null) {
            baseTemp = minTemperature + random.nextDouble() * (maxTemperature - minTemperature);
        } else {
            double change = (random.nextDouble() - 0.5) * 0.4;
            baseTemp = lastTemp + change;
        }

        if (random.nextDouble() < 0.08) {
            if (random.nextBoolean()) {
                baseTemp = maxTemperature + random.nextDouble() * 1.5;
            } else {
                baseTemp = minTemperature - random.nextDouble() * 1.0;
            }
        }

        return Math.round(baseTemp * 10.0) / 10.0;
    }

    public void startSimulation() {
        this.simulationRunning = true;
    }

    public void stopSimulation() {
        this.simulationRunning = false;
    }

    public boolean isSimulationRunning() {
        return simulationRunning;
    }

    public List<TemperatureSnapshot> getAllCurrentSnapshots() {
        return snapshotService.getAllSnapshots();
    }

    public void generateInitialData() {
        for (int bedNo = 1; bedNo <= bedCount; bedNo++) {
            double temp1 = 36.2 + random.nextDouble() * 0.8;
            double temp2 = 36.2 + random.nextDouble() * 0.8;
            detectionService.detectAndSave(bedNo, Math.round(temp1 * 10.0) / 10.0);
            detectionService.detectAndSave(bedNo, Math.round(temp2 * 10.0) / 10.0);
        }
    }
}
