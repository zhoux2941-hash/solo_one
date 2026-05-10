package com.astro.service;

import com.astro.config.AppConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AstronomyService {

    private final AppConfig appConfig;

    public double calculateElevation(double raHours, double decDegrees, LocalDateTime observationTime) {
        double lat = Math.toRadians(appConfig.getObservatory().getLatitude());
        double lon = Math.toRadians(appConfig.getObservatory().getLongitude());
        
        double dec = Math.toRadians(decDegrees);
        double ra = Math.toRadians(raHours * 15.0);
        
        double lst = calculateLocalSiderealTime(observationTime, lon);
        
        double ha = lst - ra;
        while (ha < 0) ha += 2 * Math.PI;
        while (ha > 2 * Math.PI) ha -= 2 * Math.PI;
        
        double sinAlt = Math.sin(lat) * Math.sin(dec) + 
                        Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
        sinAlt = Math.max(-1.0, Math.min(1.0, sinAlt));
        
        return Math.toDegrees(Math.asin(sinAlt));
    }

    public boolean isTargetVisible(double raHours, double decDegrees, LocalDateTime observationTime) {
        double elevation = calculateElevation(raHours, decDegrees, observationTime);
        return elevation >= appConfig.getBooking().getHorizonElevation();
    }

    public double calculateLocalSiderealTime(LocalDateTime time, double longitudeRad) {
        LocalDate date = time.toLocalDate();
        
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        int hour = time.getHour();
        int minute = time.getMinute();
        int second = time.getSecond();

        if (month < 3) {
            year--;
            month += 12;
        }
        
        double a = Math.floor(year / 100.0);
        double b = 2 - a + Math.floor(a / 4.0);
        double jd = Math.floor(365.25 * (year + 4716)) + 
                   Math.floor(30.6001 * (month + 1)) + 
                   day + b - 1524.5;
        
        double decimalHours = hour + minute / 60.0 + second / 3600.0;
        
        double t = (jd - 2451545.0) / 36525.0;
        
        double gmstDeg = 280.46061837 + 
                         360.98564736629 * (jd - 2451545.0) +
                         t * t * (0.000387933 - t / 38710000.0);
        
        gmstDeg = gmstDeg % 360;
        if (gmstDeg < 0) gmstDeg += 360;
        
        double gmstHours = gmstDeg / 15.0 + decimalHours;
        
        double lstHours = gmstHours + Math.toDegrees(longitudeRad) / 15.0;
        lstHours = lstHours % 24;
        if (lstHours < 0) lstHours += 24;
        
        return Math.toRadians(lstHours * 15.0);
    }

    public LocalDateTime calculateCivilTwilight(LocalDate date) {
        double lat = Math.toRadians(appConfig.getObservatory().getLatitude());
        double lon = appConfig.getObservatory().getLongitude();
        
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        double d = 367 * year - (7 * (year + (month + 9) / 12)) / 4 + 
                (275 * month) / 9 + day - 730531.5;

        double L = 4.8949504201433 + 0.01720279239989 * d;
        double g = 6.2400408 + 0.01720197 * d;

        double lambda = L + 0.033423 * Math.sin(g) + 
                        0.000349 * Math.sin(2 * g);

        double epsilon = 0.409093 - 0.000000006972 * d;

        double sinDelta = Math.sin(epsilon) * Math.sin(lambda);
        double cosDelta = Math.sqrt(1 - sinDelta * sinDelta);

        double sinH = (Math.sin(-Math.toRadians(6.0)) - Math.sin(lat) * sinDelta) / 
                  (Math.cos(lat) * cosDelta);

        sinH = Math.max(-1.0, Math.min(1.0, sinH));

        double H = Math.acos(sinH) * 12 / Math.PI;

        double solarNoonHours = 12 - lon / 15.0;

        double twilightHours = solarNoonHours - H;

        int hours = (int) Math.floor(twilightHours);
        int minutes = (int) Math.round((twilightHours - hours) * 60);

        hours = hours % 24;
        if (hours < 0) hours += 24;

        minutes = minutes % 60;
        if (minutes < 0) minutes += 60;

        return date.atTime(hours, minutes, 0);
    }

    public double calculateSkyBrightness(LocalDate date) {
        double j2000Days = date.getDayOfYear();
        
        double baseBrightness = 5000.0 + 500.0 * Math.sin(j2000Days / 365.0 * 2 * Math.PI);
        
        double randomFactor = 0.9 + 0.2 * Math.random();
        
        return baseBrightness * randomFactor;
    }
}
