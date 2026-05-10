package com.tide.service;

import com.tide.model.Location;
import com.tide.model.MoonPhase;
import com.tide.model.TideRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TideCalculationService {

    private static final double TIDE_PERIOD_HOURS = 12.42;
    private static final double SPRING_TIDE_RANGE = 2.5;
    private static final double NEAP_TIDE_RANGE = 1.0;
    private static final double MEAN_SEA_LEVEL = 0.0;

    @Autowired
    private MoonPhaseService moonPhaseService;

    public List<TideRecord> generateMonthlyTideTable(Location location, int year, int month) {
        List<TideRecord> records = new ArrayList<>();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1);
        
        LocalDateTime current = startDate.atStartOfDay();
        
        while (current.isBefore(endDate.atStartOfDay())) {
            MoonPhase moonPhase = moonPhaseService.calculateMoonPhase(current.toLocalDate());
            double theoreticalHeight = calculateTheoreticalHeight(
                    location, 
                    current, 
                    moonPhase
            );

            TideRecord record = TideRecord.builder()
                    .location(location)
                    .recordTime(current)
                    .theoreticalHeight(theoreticalHeight)
                    .build();

            records.add(record);
            current = current.plusMinutes(30);
        }

        return records;
    }

    public List<TideRecord> generateDailyTideTable(Location location, LocalDate date) {
        List<TideRecord> records = new ArrayList<>();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        
        MoonPhase moonPhase = moonPhaseService.calculateMoonPhase(date);
        
        LocalDateTime current = start;
        while (current.isBefore(end)) {
            double theoreticalHeight = calculateTheoreticalHeight(
                    location, 
                    current, 
                    moonPhase
            );

            TideRecord record = TideRecord.builder()
                    .location(location)
                    .recordTime(current)
                    .theoreticalHeight(theoreticalHeight)
                    .build();

            records.add(record);
            current = current.plusMinutes(30);
        }

        return records;
    }

    public double calculateTheoreticalHeight(Location location, LocalDateTime dateTime, MoonPhase moonPhase) {
        double phase = moonPhase.getPhase();
        
        double tideRange;
        if (moonPhase.getMoonDistanceKm() != null) {
            tideRange = calculateTideRangeWithDistance(phase, moonPhase.getMoonDistanceKm());
        } else {
            tideRange = calculateTideRange(phase);
        }
        
        double phaseAngle = calculatePhaseAngle(dateTime, location, moonPhase);
        
        return MEAN_SEA_LEVEL + (tideRange / 2) * Math.sin(phaseAngle);
    }

    private double calculateTideRange(double moonPhase) {
        double phaseAngle = moonPhase * 2 * Math.PI;
        double springFactor = Math.abs(Math.cos(phaseAngle));
        
        return NEAP_TIDE_RANGE + (SPRING_TIDE_RANGE - NEAP_TIDE_RANGE) * springFactor;
    }
    
    public double calculateTideRangeWithDistance(double moonPhase, double moonDistanceKm) {
        double baseRange = calculateTideRange(moonPhase);
        
        double meanDistance = 384400.0;
        double distanceFactor = Math.pow(meanDistance / moonDistanceKm, 3);
        
        double minDistance = 363300.0;
        double maxDistance = 405500.0;
        double normalizedDistance = (moonDistanceKm - minDistance) / (maxDistance - minDistance);
        double distanceFactor2 = 1.0 + 0.3 * (1.0 - normalizedDistance);
        
        double combinedFactor = (distanceFactor + distanceFactor2) / 2;
        
        return baseRange * combinedFactor;
    }

    private double calculatePhaseAngle(LocalDateTime dateTime, Location location, MoonPhase moonPhase) {
        LocalTime meridianTime = moonPhase.getMeridianTime();
        if (meridianTime == null) {
            meridianTime = LocalTime.NOON;
        }

        double hoursSinceMeridian = calculateHoursFromMeridian(dateTime, meridianTime);
        double longitudeCorrection = location.getLongitude() / 15.0;
        
        double angle = (hoursSinceMeridian + longitudeCorrection) * (2 * Math.PI / TIDE_PERIOD_HOURS);
        
        return angle + Math.PI / 2;
    }

    private double calculateHoursFromMeridian(LocalDateTime dateTime, LocalTime meridianTime) {
        LocalTime currentTime = dateTime.toLocalTime();
        
        double currentHours = currentTime.getHour() + currentTime.getMinute() / 60.0;
        double meridianHours = meridianTime.getHour() + meridianTime.getMinute() / 60.0;
        
        double diff = currentHours - meridianHours;
        if (diff > 12) {
            diff -= 24;
        } else if (diff < -12) {
            diff += 24;
        }
        
        return diff;
    }

    public double calculateDeviation(double theoretical, double actual) {
        if (theoretical == 0) {
            return actual;
        }
        return actual - theoretical;
    }
}
