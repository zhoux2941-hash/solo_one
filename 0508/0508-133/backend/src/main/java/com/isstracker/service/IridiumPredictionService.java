package com.isstracker.service;

import com.isstracker.dto.IridiumFlareEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class IridiumPredictionService {
    
    private static final Logger logger = LoggerFactory.getLogger(IridiumPredictionService.class);
    
    private static final double VISIBLE_ELEVATION_THRESHOLD = 10.0;
    private static final int DAYS_TO_PREDICT = 7;
    private static final double IRIDIUM_BRIGHTEST_MAG = -8.0;
    private static final double IRIDIUM_DIMMEST_MAG = -2.0;
    
    private static final String[] SATELLITE_NAMES = {
        "Iridium 3", "Iridium 7", "Iridium 14", "Iridium 21", "Iridium 28",
        "Iridium 33", "Iridium 40", "Iridium 47", "Iridium 54", "Iridium 61",
        "Iridium 75", "Iridium 82", "Iridium 91", "Iridium 95", "Iridium 100"
    };
    
    private static final String[] FLARE_TYPES = {
        "主天线闪光", "副天线闪光", "太阳能板闪光"
    };
    
    private final Random random = new Random();
    
    public List<IridiumFlareEvent> predictFlares(double latitude, double longitude) {
        logger.info("Predicting Iridium flares for lat={}, lon={}", latitude, longitude);
        
        List<IridiumFlareEvent> events = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        int baseIntervalHours = 4;
        int estimatedFlares = (DAYS_TO_PREDICT * 24) / baseIntervalHours;
        
        LocalDateTime eventTime = now.plusHours(1);
        
        for (int i = 0; i < estimatedFlares; i++) {
            double randomOffset = (random.nextDouble() - 0.5) * 3;
            eventTime = eventTime.plusHours(baseIntervalHours + (long) randomOffset);
            
            if (eventTime.isAfter(now.plusDays(DAYS_TO_PREDICT))) {
                break;
            }
            
            if (shouldGenerateFlare(i)) {
                IridiumFlareEvent event = createFlareEvent(eventTime, latitude, longitude, i);
                if (event != null) {
                    events.add(event);
                }
            }
        }
        
        events.sort((a, b) -> a.getFlareTime().compareTo(b.getFlareTime()));
        
        logger.info("Generated {} Iridium flare events", events.size());
        return events;
    }
    
    private boolean shouldGenerateFlare(int index) {
        double prob = 0.3 + (random.nextDouble() * 0.4);
        return random.nextDouble() < prob;
    }
    
    private IridiumFlareEvent createFlareEvent(LocalDateTime flareTime, double latitude, double longitude, int index) {
        double elevation = 15 + (random.nextDouble() * 75);
        if (elevation < 5) {
            return null;
        }
        
        double azimuth = random.nextDouble() * 360;
        int durationSeconds = 5 + random.nextInt(15);
        double brightness = calculateBrightness(elevation);
        
        boolean visible = elevation > VISIBLE_ELEVATION_THRESHOLD && brightness <= -3.0;
        
        String eventId = generateEventId(latitude, longitude, flareTime);
        
        IridiumFlareEvent event = new IridiumFlareEvent();
        event.setEventId(eventId);
        event.setSatelliteName(SATELLITE_NAMES[random.nextInt(SATELLITE_NAMES.length)]);
        event.setFlareTime(flareTime);
        event.setBrightness(roundTo1Decimal(brightness));
        event.setElevation(roundTo1Decimal(elevation));
        event.setAzimuth(roundTo1Decimal(azimuth));
        event.setDirection(azimuthToDirection(azimuth));
        event.setDurationSeconds(durationSeconds);
        event.setFlareType(FLARE_TYPES[random.nextInt(FLARE_TYPES.length)]);
        event.setLatitude(latitude);
        event.setLongitude(longitude);
        event.setVisible(visible);
        event.setEventType("IRIDIUM_FLARE");
        event.setObserverCount(0);
        
        return event;
    }
    
    private double calculateBrightness(double elevation) {
        double elevationFactor = elevation / 90.0;
        double baseBrightness = IRIDIUM_DIMMEST_MAG - elevationFactor * (IRIDIUM_DIMMEST_MAG - IRIDIUM_BRIGHTEST_MAG);
        double randomVariation = (random.nextDouble() - 0.5) * 1.0;
        double brightness = baseBrightness + randomVariation;
        
        if (brightness < IRIDIUM_BRIGHTEST_MAG) {
            brightness = IRIDIUM_BRIGHTEST_MAG;
        } else if (brightness > IRIDIUM_DIMMEST_MAG) {
            brightness = IRIDIUM_DIMMEST_MAG;
        }
        
        return roundTo1Decimal(brightness);
    }
    
    private String generateEventId(double latitude, double longitude, LocalDateTime time) {
        String base = String.format("IRIDIUM_%.2f_%.2f_%s", latitude, longitude, 
                time.toString().replace(":", "").replace(".", ""));
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
}
