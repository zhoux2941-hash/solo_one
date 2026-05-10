package com.tide.service;

import com.tide.model.MoonPhase;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class MoonPhaseService {
    
    private static final double SYNODIC_MONTH = 29.53058867;
    private static final double BASE_DATE_JD = 2451549.5;
    private static final double BASE_PHASE = 0.0;
    
    private static final double ANOMALISTIC_MONTH = 27.55454988;
    private static final double BASE_PERIGEE_JD = 2451550.09765;
    private static final double MOON_MEAN_DISTANCE = 384400.0;
    private static final double MOON_PERIGEE = 363300.0;
    private static final double MOON_APOGEE = 405500.0;
    private static final double MOON_ECCENTRICITY = 0.0549;
    
    private static final double SPRING_TIDE_PHASE_TOLERANCE = 0.05;
    private static final double PERIGEE_TOLERANCE_DAYS = 1.5;
    private static final double ASTRONOMICAL_SPRING_DISTANCE_THRESHOLD = 370000.0;

    public MoonPhase calculateMoonPhase(LocalDate date) {
        double jd = toJulianDate(date);
        
        double phase = calculatePhase(jd);
        String phaseName = getPhaseName(phase);
        double illumination = calculateIllumination(phase);
        
        double moonDistance = calculateMoonDistance(jd);
        double moonDistanceKm = moonDistance * MOON_MEAN_DISTANCE;
        boolean isPerigee = isNearPerigee(jd);
        boolean isApogee = isNearApogee(jd);
        
        boolean isSpringTide = isSpringTide(phase);
        boolean isAstronomicalSpringTide = isAstronomicalSpringTide(phase, moonDistanceKm);
        
        String tideIntensity = getTideIntensity(phase, moonDistanceKm, isAstronomicalSpringTide);
        String description = generateDescription(phaseName, isSpringTide, isAstronomicalSpringTide, isPerigee, moonDistanceKm);
        
        LocalTime moonrise = calculateMoonrise(phase);
        LocalTime moonset = calculateMoonset(phase);
        LocalTime meridian = calculateMeridian(phase);

        return MoonPhase.builder()
                .date(date)
                .phase(phase)
                .phaseName(phaseName)
                .illumination(illumination)
                .moonriseTime(moonrise)
                .moonsetTime(moonset)
                .meridianTime(meridian)
                .moonDistance(moonDistance)
                .moonDistanceKm(moonDistanceKm)
                .isPerigee(isPerigee)
                .isApogee(isApogee)
                .isSpringTide(isSpringTide)
                .isAstronomicalSpringTide(isAstronomicalSpringTide)
                .tideIntensity(tideIntensity)
                .description(description)
                .build();
    }
    
    public double calculatePhase(double jd) {
        double daysSinceBase = jd - BASE_DATE_JD;
        double cycles = daysSinceBase / SYNODIC_MONTH;
        double phase = cycles - Math.floor(cycles);
        
        if (phase < 0) {
            phase += 1;
        }
        
        return phase;
    }
    
    public double calculateMoonDistance(double jd) {
        double daysSincePerigee = jd - BASE_PERIGEE_JD;
        double anomalyCycles = daysSincePerigee / ANOMALISTIC_MONTH;
        double anomaly = (anomalyCycles - Math.floor(anomalyCycles)) * 2 * Math.PI;
        
        double distanceRatio = (1 - MOON_ECCENTRICITY * MOON_ECCENTRICITY) / 
                              (1 + MOON_ECCENTRICITY * Math.cos(anomaly));
        
        return distanceRatio;
    }
    
    public boolean isNearPerigee(double jd) {
        double daysSincePerigee = jd - BASE_PERIGEE_JD;
        double anomalyCycles = daysSincePerigee / ANOMALISTIC_MONTH;
        double anomalyFraction = anomalyCycles - Math.floor(anomalyCycles);
        
        double distanceToPerigee = Math.min(anomalyFraction, 1 - anomalyFraction) * ANOMALISTIC_MONTH;
        
        return distanceToPerigee <= PERIGEE_TOLERANCE_DAYS;
    }
    
    public boolean isNearApogee(double jd) {
        double daysSincePerigee = jd - BASE_PERIGEE_JD;
        double anomalyCycles = daysSincePerigee / ANOMALISTIC_MONTH;
        double anomalyFraction = anomalyCycles - Math.floor(anomalyCycles);
        
        double distanceToApogee = Math.abs(anomalyFraction - 0.5);
        distanceToApogee = Math.min(distanceToApogee, 1 - distanceToApogee) * ANOMALISTIC_MONTH;
        
        return distanceToApogee <= PERIGEE_TOLERANCE_DAYS;
    }
    
    public boolean isSpringTide(double phase) {
        double phaseDegrees = phase * 360;
        
        return (phaseDegrees < SPRING_TIDE_PHASE_TOLERANCE * 360 || 
                phaseDegrees > 360 - SPRING_TIDE_PHASE_TOLERANCE * 360) ||
               (Math.abs(phaseDegrees - 180) < SPRING_TIDE_PHASE_TOLERANCE * 360);
    }
    
    public boolean isAstronomicalSpringTide(double phase, double distanceKm) {
        return isSpringTide(phase) && distanceKm <= ASTRONOMICAL_SPRING_DISTANCE_THRESHOLD;
    }
    
    private String getTideIntensity(double phase, double distanceKm, boolean isAstronomicalSpring) {
        if (isAstronomicalSpring) {
            return "天文大潮";
        }
        
        if (isSpringTide(phase)) {
            if (distanceKm < 375000) {
                return "大潮（近地点）";
            }
            return "大潮";
        }
        
        double phaseDegrees = phase * 360;
        boolean isNeap = (Math.abs(phaseDegrees - 90) < SPRING_TIDE_PHASE_TOLERANCE * 360) ||
                         (Math.abs(phaseDegrees - 270) < SPRING_TIDE_PHASE_TOLERANCE * 360);
        
        if (isNeap) {
            if (distanceKm > 395000) {
                return "小潮（远地点）";
            }
            return "小潮";
        }
        
        return "正常潮汐";
    }
    
    private String generateDescription(String phaseName, boolean isSpring, boolean isAstroSpring, 
                                        boolean isPerigee, double distanceKm) {
        StringBuilder desc = new StringBuilder();
        
        if (isAstroSpring) {
            desc.append("🌟 天文大潮预警！");
            desc.append("当前为").append(phaseName);
            desc.append("，且月球位于近地点附近（距离约").append(String.format("%.0f", distanceKm)).append("公里）。");
            desc.append("潮汐范围将达到最大，请注意潮汐变化。");
        } else if (isSpring) {
            desc.append("大潮期：当前为").append(phaseName);
            if (isPerigee) {
                desc.append("，月球接近近地点（距离约").append(String.format("%.0f", distanceKm)).append("公里）。");
                desc.append("潮汐范围较大。");
            } else {
                desc.append("，太阳、地球、月亮近乎一线，潮汐范围较大。");
            }
        } else if (isPerigee) {
            desc.append("月球接近近地点（距离约").append(String.format("%.0f", distanceKm)).append("公里），");
            desc.append("引力增强，可能对潮汐产生一定影响。");
        } else {
            desc.append("当前为").append(phaseName);
            desc.append("，月地距离约").append(String.format("%.0f", distanceKm)).append("公里。");
            desc.append("潮汐处于正常范围。");
        }
        
        return desc.toString();
    }

    private double toJulianDate(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        if (month <= 2) {
            year--;
            month += 12;
        }

        int a = year / 100;
        int b = 2 - a + a / 4;

        return Math.floor(365.25 * (year + 4716)) 
                + Math.floor(30.6001 * (month + 1)) 
                + day + b - 1524.5;
    }

    private String getPhaseName(double phase) {
        double degrees = phase * 360;
        
        if (degrees < 1.875 || degrees >= 358.125) {
            return "新月";
        } else if (degrees < 88.125) {
            return "蛾眉月";
        } else if (degrees < 91.875) {
            return "上弦月";
        } else if (degrees < 178.125) {
            return "盈凸月";
        } else if (degrees < 181.875) {
            return "满月";
        } else if (degrees < 268.125) {
            return "亏凸月";
        } else if (degrees < 271.875) {
            return "下弦月";
        } else {
            return "残月";
        }
    }

    private double calculateIllumination(double phase) {
        return (1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100;
    }

    private LocalTime calculateMoonrise(double phase) {
        double hours = 6 + phase * 24;
        return hoursToTime(hours % 24);
    }

    private LocalTime calculateMoonset(double phase) {
        double hours = 18 + phase * 24;
        return hoursToTime(hours % 24);
    }

    private LocalTime calculateMeridian(double phase) {
        double hours = 12 + phase * 24;
        return hoursToTime(hours % 24);
    }

    private LocalTime hoursToTime(double hours) {
        int h = (int) Math.floor(hours);
        int m = (int) Math.floor((hours - h) * 60);
        return LocalTime.of(h % 24, m);
    }
}
