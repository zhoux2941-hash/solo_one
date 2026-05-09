package com.bikesharing.platform.scheduler;

import com.bikesharing.platform.service.ParkingPointService;
import com.bikesharing.platform.service.PredictionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PredictionScheduler {

    private final PredictionService predictionService;
    private final ParkingPointService parkingPointService;

    @PostConstruct
    public void init() {
        log.info("Initializing Redis data on startup...");
        try {
            parkingPointService.initializeRedisData();
            log.info("Redis data initialization completed");
        } catch (Exception e) {
            log.error("Failed to initialize Redis data: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 900000, initialDelay = 60000)
    public void refreshPredictions() {
        log.info("Starting scheduled prediction refresh (every 15 minutes)...");
        try {
            predictionService.refreshPredictions();
            log.info("Scheduled prediction refresh completed successfully");
        } catch (Exception e) {
            log.error("Scheduled prediction refresh failed: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedRate = 300000)
    public void syncRedisToDatabase() {
        log.debug("Starting scheduled Redis to DB sync...");
        try {
            parkingPointService.syncRedisToDatabase();
            log.debug("Redis to DB sync completed");
        } catch (Exception e) {
            log.error("Redis to DB sync failed: {}", e.getMessage());
        }
    }
}
