package com.isstracker.service;

import com.isstracker.dto.IssPassEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class IssPredictionService {
    
    private static final Logger logger = LoggerFactory.getLogger(IssPredictionService.class);
    
    private static final double ISS_ORBITAL_PERIOD = 92.0;
    private static final double VISIBLE_ELEVATION_THRESHOLD = 10.0;
    private static final int DAYS_TO_PREDICT = 7;
    private static final double ISS_BRIGHTEST_MAG = -3.5;
    private static final double ISS_DIMMEST_MAG = 0.0;
    
    private final Random random = new Random();
    
    public List<IssPassEvent> predictPasses(double latitude, double longitude) {
        logger.info("Predicting ISS passes for lat={}, lon={}", latitude, longitude);
        
        List<IssPassEvent> events = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        double baseIntervalHours = ISS_ORBITAL_PERIOD / 60.0;
        int estimatedPasses = (int) (DAYS_TO_PREDICT * 24 / baseIntervalHours);
        
        LocalDateTime eventTime = now;
        
        for (int i = 0; i < estimatedPasses; i++) {
            double randomOffset = (random.nextDouble() - 0.5) * 4;
            eventTime = eventTime.plusMinutes((long) (ISS_ORBITAL_PERIOD + randomOffset));
            
            if (eventTime.isAfter(now.plusDays(DAYS_TO_PREDICT))) {
                break;
            }
            
            if (shouldGeneratePass(latitude, longitude, i)) {
                IssPassEvent event = createPassEvent(eventTime, latitude, longitude, i);
                if (event != null) {
                    events.add(event);
                }
            }
        }
        
        logger.info("Generated {} ISS pass events", events.size());
        return events;
    }
    
    private boolean shouldGeneratePass(double latitude, double longitude, int index) {
        double prob = 0.4 + (random.nextDouble() * 0.3);
        return random.nextDouble() < prob;
    }
    
    private IssPassEvent createPassEvent(LocalDateTime eventTime, double latitude, double longitude, int index) {
        double maxElevation = 5 + (random.nextDouble() * 80);
        if (maxElevation < 3) {
            return null;
        }
        
        int durationMinutes = 3 + random.nextInt(6);
        LocalDateTime riseTime = eventTime.minusMinutes(durationMinutes / 2);
        LocalDateTime setTime = eventTime.plusMinutes(durationMinutes / 2);
        LocalDateTime maxElevationTime = eventTime;
        
        double riseAzimuth = random.nextDouble() * 360;
        double setAzimuth = (riseAzimuth + 90 + random.nextDouble() * 180) % 360;
        double maxAzimuth = (riseAzimuth + setAzimuth) / 2 % 360;
        
        double brightness = calculateBrightness(maxElevation);
        
        boolean visible = maxElevation > VISIBLE_ELEVATION_THRESHOLD;
        
        String eventId = generateEventId(latitude, longitude, maxElevationTime);
        
        IssPassEvent event = new IssPassEvent();
        event.setEventId(eventId);
        event.setRiseTime(riseTime);
        event.setSetTime(setTime);
        event.setMaxElevationTime(maxElevationTime);
        event.setMaxElevation(roundTo1Decimal(maxElevation));
        event.setRiseAzimuth(roundTo1Decimal(riseAzimuth));
        event.setSetAzimuth(roundTo1Decimal(setAzimuth));
        event.setMaxAzimuth(roundTo1Decimal(maxAzimuth));
        event.setRiseDirection(azimuthToDirection(riseAzimuth));
        event.setSetDirection(azimuthToDirection(setAzimuth));
        event.setMaxDirection(azimuthToDirection(maxAzimuth));
        event.setBrightness(roundTo1Decimal(brightness));
        event.setVisible(visible);
        event.setObserverCount(0);
        
        return event;
    }
    
    private String generateEventId(double latitude, double longitude, LocalDateTime maxTime) {
        String base = String.format("%.2f_%.2f_%s", latitude, longitude, 
                maxTime.toString().replace(":", "").replace(".", ""));
        return UUID.nameUUIDFromBytes(base.getBytes()).toString();
    }
    
    private String azimuthToDirection(double azimuth) {
        String[] directions = {"北", "东北", "东", "东南", "南", "西南", "西", "西北"};
        int index = (int) ((azimuth + 22.5) / 45) % 8;
        return directions[index];
    }
    
    private double roundTo1Decimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
    
    private double calculateBrightness(double maxElevation) {
        double elevationFactor = maxElevation / 90.0;
        double baseBrightness = ISS_DIMMEST_MAG - elevationFactor * (ISS_DIMMEST_MAG - ISS_BRIGHTEST_MAG);
        double randomVariation = (random.nextDouble() - 0.5) * 0.8;
        double brightness = baseBrightness + randomVariation;
        
        if (brightness < ISS_BRIGHTEST_MAG) {
            brightness = ISS_BRIGHTEST_MAG;
        } else if (brightness > ISS_DIMMEST_MAG) {
            brightness = ISS_DIMMEST_MAG;
        }
        
        return roundTo1Decimal(brightness);
    }
}
