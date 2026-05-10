package com.lightpollution.util;

import java.time.*;
import java.time.temporal.ChronoUnit;

public class AstronomyUtils {

    private static final double DEG_TO_RAD = Math.PI / 180.0;
    private static final double RAD_TO_DEG = 180.0 / Math.PI;

    public static double toRadians(double degrees) {
        return degrees * DEG_TO_RAD;
    }

    public static double toDegrees(double radians) {
        return radians * RAD_TO_DEG;
    }

    public static double julianDay(LocalDateTime dateTime) {
        int year = dateTime.getYear();
        int month = dateTime.getMonthValue();
        int day = dateTime.getDayOfMonth();
        double hour = dateTime.getHour() + dateTime.getMinute() / 60.0 + dateTime.getSecond() / 3600.0;

        if (month <= 2) {
            year--;
            month += 12;
        }

        double a = Math.floor(year / 100.0);
        double b = 2 - a + Math.floor(a / 4.0);

        double jd = Math.floor(365.25 * (year + 4716)) +
                    Math.floor(30.6001 * (month + 1)) +
                    day + hour / 24.0 + b - 1524.5;

        return jd;
    }

    public static double getJulianCentury(double jd) {
        return (jd - 2451545.0) / 36525.0;
    }

    public static double getSunDeclination(double jd) {
        double T = getJulianCentury(jd);
        double L = 280.46646 + T * (36000.76983 + T * 0.0003032);
        double M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
        double e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
        double C = Math.sin(toRadians(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
                   Math.sin(toRadians(2 * M)) * (0.019993 - 0.000101 * T) +
                   Math.sin(toRadians(3 * M)) * 0.000289;

        double trueLong = L + C;
        double omega = 125.04 - 1934.136 * T;
        double lambda = trueLong - 0.00569 - 0.00478 * Math.sin(toRadians(omega));
        double epsilon = 23.0 + (26.0 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60.0) / 60.0;
        epsilon = epsilon + 0.00256 * Math.cos(toRadians(omega));

        double declination = toDegrees(Math.asin(Math.sin(toRadians(epsilon)) * Math.sin(toRadians(lambda))));
        return declination;
    }

    public static double getSunRightAscension(double jd) {
        double T = getJulianCentury(jd);
        double L = 280.46646 + T * (36000.76983 + T * 0.0003032);
        double M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
        double C = Math.sin(toRadians(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
                   Math.sin(toRadians(2 * M)) * (0.019993 - 0.000101 * T) +
                   Math.sin(toRadians(3 * M)) * 0.000289;

        double trueLong = L + C;
        double omega = 125.04 - 1934.136 * T;
        double lambda = trueLong - 0.00569 - 0.00478 * Math.sin(toRadians(omega));
        double epsilon = 23.0 + (26.0 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60.0) / 60.0;
        epsilon = epsilon + 0.00256 * Math.cos(toRadians(omega));

        double x = Math.cos(toRadians(lambda));
        double y = Math.cos(toRadians(epsilon)) * Math.sin(toRadians(lambda));
        double ra = toDegrees(Math.atan2(y, x));
        if (ra < 0) ra += 360;
        return ra;
    }

    public static LocalDateTime calculateSunTime(LocalDate date, double latitude, double longitude, double targetAltitude, boolean isRise) {
        LocalDateTime noon = LocalDateTime.of(date, LocalTime.of(12, 0));
        double jdNoon = julianDay(noon);
        double declination = getSunDeclination(jdNoon);

        double latRad = toRadians(latitude);
        double decRad = toRadians(declination);
        double altRad = toRadians(targetAltitude);

        double cosHourAngle = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
                              (Math.cos(latRad) * Math.cos(decRad));

        if (cosHourAngle > 1 || cosHourAngle < -1) {
            return null;
        }

        double hourAngle = toDegrees(Math.acos(cosHourAngle));
        double solarNoon = 12.0 - longitude / 15.0;
        double equationOfTime = calculateEquationOfTime(jdNoon);
        solarNoon = solarNoon - equationOfTime / 60.0;

        double hourOffset = hourAngle / 15.0;
        double targetHour = isRise ? (solarNoon - hourOffset) : (solarNoon + hourOffset);

        if (targetHour < 0) targetHour += 24;
        if (targetHour >= 24) targetHour -= 24;

        int hours = (int) targetHour;
        int minutes = (int) ((targetHour - hours) * 60);

        return LocalDateTime.of(date, LocalTime.of(Math.min(hours, 23), Math.min(minutes, 59)));
    }

    private static double calculateEquationOfTime(double jd) {
        double T = getJulianCentury(jd);
        double epsilon = 23.4397 - 0.00000036 * T * 36525;
        double L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        double e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
        double M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;

        double y = Math.tan(toRadians(epsilon / 2));
        y = y * y;

        double eqTime = y * Math.sin(toRadians(2 * L)) -
                        2 * e * Math.sin(toRadians(M)) +
                        4 * e * y * Math.sin(toRadians(M)) * Math.cos(toRadians(2 * L)) -
                        0.5 * y * y * Math.sin(toRadians(4 * L)) -
                        1.25 * e * e * Math.sin(toRadians(2 * M));

        return eqTime * 4;
    }

    public static LocalDateTime getSunrise(LocalDate date, double latitude, double longitude) {
        return calculateSunTime(date, latitude, longitude, -0.833, true);
    }

    public static LocalDateTime getSunset(LocalDate date, double latitude, double longitude) {
        return calculateSunTime(date, latitude, longitude, -0.833, false);
    }

    public static LocalDateTime getAstronomicalDusk(LocalDate date, double latitude, double longitude) {
        return calculateSunTime(date, latitude, longitude, -18.0, false);
    }

    public static LocalDateTime getAstronomicalDawn(LocalDate date, double latitude, double longitude) {
        return calculateSunTime(date, latitude, longitude, -18.0, true);
    }

    public static double getMoonIllumination(LocalDate date) {
        LocalDateTime dt = LocalDateTime.of(date, LocalTime.NOON);
        double jd = julianDay(dt);

        double T = (jd - 2451550.1) / 29.530588853;
        T = T - Math.floor(T);

        double age = T * 29.53;
        double illumination = (1 - Math.cos(T * 2 * Math.PI)) / 2;

        return illumination;
    }

    public static int getMoonPhaseIndex(LocalDate date) {
        double illumination = getMoonIllumination(date);
        LocalDateTime dt = LocalDateTime.of(date, LocalTime.NOON);
        double jd = julianDay(dt);
        double T = (jd - 2451550.1) / 29.530588853;
        T = T - Math.floor(T);

        if (T < 0.03 || T > 0.97) return 0;
        if (T < 0.22) return 1;
        if (T < 0.28) return 2;
        if (T < 0.47) return 3;
        if (T < 0.53) return 4;
        if (T < 0.72) return 5;
        if (T < 0.78) return 6;
        return 7;
    }

    public static String getMoonPhaseName(int index) {
        String[] phases = {
            "新月", "峨眉月", "上弦月", "盈凸月",
            "满月", "亏凸月", "下弦月", "残月"
        };
        return phases[index];
    }

    public static double getObservationWindowHours(LocalDate date, double latitude, double longitude) {
        LocalDateTime dusk = getAstronomicalDusk(date, latitude, longitude);
        LocalDateTime dawn = getAstronomicalDawn(date.plusDays(1), latitude, longitude);

        if (dusk == null || dawn == null) return 0;

        LocalDateTime adjustedDawn = dawn.isBefore(dusk) ? dawn.plusDays(1) : dawn;
        return ChronoUnit.MINUTES.between(dusk, adjustedDawn) / 60.0;
    }

    public static LocalDateTime getMoonRise(LocalDate date, double latitude, double longitude) {
        LocalDateTime baseTime = LocalDateTime.of(date, LocalTime.of(18, 0));
        for (int i = 0; i < 24; i++) {
            LocalDateTime time = baseTime.plusHours(i);
            if (getMoonAltitude(time, latitude, longitude) > 0) {
                return time;
            }
        }
        return null;
    }

    public static LocalDateTime getMoonSet(LocalDate date, double latitude, double longitude) {
        LocalDateTime baseTime = LocalDateTime.of(date, LocalTime.of(6, 0));
        for (int i = 0; i < 24; i++) {
            LocalDateTime time = baseTime.plusHours(i);
            if (getMoonAltitude(time, latitude, longitude) < 0) {
                return time;
            }
        }
        return null;
    }

    public static double getMoonAltitude(LocalDateTime time, double latitude, double longitude) {
        double jd = julianDay(time);
        double T = getJulianCentury(jd);

        double Lp = 218.316 + 13.176396 * (jd - 2451545.0);
        double M = 134.963 + 13.064993 * (jd - 2451545.0);
        double F = 93.272 + 13.229350 * (jd - 2451545.0);

        Lp = normalizeAngle(Lp);
        M = normalizeAngle(M);
        F = normalizeAngle(F);

        double moonLong = Lp + 6.289 * Math.sin(toRadians(M));
        double moonLat = 5.128 * Math.sin(toRadians(F));

        double epsilon = 23.4397;
        double alpha = Math.atan2(
            Math.sin(toRadians(moonLong)) * Math.cos(toRadians(epsilon)) -
            Math.tan(toRadians(moonLat)) * Math.sin(toRadians(epsilon)),
            Math.cos(toRadians(moonLong))
        );
        double delta = Math.asin(
            Math.sin(toRadians(moonLat)) * Math.cos(toRadians(epsilon)) +
            Math.cos(toRadians(moonLat)) * Math.sin(toRadians(epsilon)) * Math.sin(toRadians(moonLong))
        );

        double lst = getLocalSiderealTime(time, longitude);
        double HA = normalizeAngle(lst - toDegrees(alpha));
        if (HA > 180) HA -= 360;

        double altitude = Math.asin(
            Math.sin(toRadians(latitude)) * Math.sin(delta) +
            Math.cos(toRadians(latitude)) * Math.cos(delta) * Math.cos(toRadians(HA))
        );

        return toDegrees(altitude);
    }

    private static double normalizeAngle(double angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    private static double getLocalSiderealTime(LocalDateTime time, double longitude) {
        double jd = julianDay(time);
        double T = getJulianCentury(jd);
        double gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                    0.000387933 * T * T - T * T * T / 38710000;
        return normalizeAngle(gst + longitude);
    }

    public static boolean isMoonUpDuringObservation(LocalDate date, double latitude, double longitude) {
        LocalDateTime dusk = getAstronomicalDusk(date, latitude, longitude);
        LocalDateTime dawn = getAstronomicalDawn(date.plusDays(1), latitude, longitude);

        if (dusk == null || dawn == null) return false;

        LocalDateTime midnight = LocalDateTime.of(date.plusDays(1), LocalTime.MIDNIGHT);
        double midAlt = getMoonAltitude(midnight, latitude, longitude);

        return midAlt > 5;
    }
}
