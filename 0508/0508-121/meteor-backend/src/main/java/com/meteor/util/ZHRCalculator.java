package com.meteor.util;

public class ZHRCalculator {

    private static final double DEFAULT_LIMITING_MAGNITUDE = 6.5;
    private static final double POPULATION_INDEX = 2.0;
    private static final double EPSILON = 1e-10;

    public static class ZHRResult {
        private double zhr;
        private double rawRate;
        private double durationHours;
        private int meteorCount;
        private double cloudCorrection;
        private double lmCorrection;
        private double zenithCorrection;
        private double confidence;
        private String notes;

        public ZHRResult(double zhr, double rawRate, double durationHours, int meteorCount,
                         double cloudCorrection, double lmCorrection, double zenithCorrection,
                         double confidence, String notes) {
            this.zhr = zhr;
            this.rawRate = rawRate;
            this.durationHours = durationHours;
            this.meteorCount = meteorCount;
            this.cloudCorrection = cloudCorrection;
            this.lmCorrection = lmCorrection;
            this.zenithCorrection = zenithCorrection;
            this.confidence = confidence;
            this.notes = notes;
        }

        public double getZhr() { return zhr; }
        public double getRawRate() { return rawRate; }
        public double getDurationHours() { return durationHours; }
        public int getMeteorCount() { return meteorCount; }
        public double getCloudCorrection() { return cloudCorrection; }
        public double getLmCorrection() { return lmCorrection; }
        public double getZenithCorrection() { return zenithCorrection; }
        public double getConfidence() { return confidence; }
        public String getNotes() { return notes; }
    }

    public static ZHRResult calculateZHR(
            int meteorCount,
            double durationMinutes,
            Double cloudCover,
            Double limitingMagnitude,
            Double radiantAltitudeDegrees) {

        if (meteorCount <= 0) {
            return new ZHRResult(0, 0, 0, 0, 1, 1, 1, 0, "没有观测到流星");
        }

        if (durationMinutes <= 0) {
            return new ZHRResult(0, 0, 0, meteorCount, 1, 1, 1, 0, "观测时长无效");
        }

        double durationHours = durationMinutes / 60.0;
        double rawRate = meteorCount / durationHours;

        double cloudCorrection = calculateCloudCorrection(cloudCover);
        double lmCorrection = calculateLimitingMagnitudeCorrection(limitingMagnitude);
        double zenithCorrection = calculateZenithCorrection(radiantAltitudeDegrees);

        double zhr = rawRate * cloudCorrection * lmCorrection * zenithCorrection;

        if (!isValidDouble(zhr) || zhr < 0 || zhr > 100000) {
            return new ZHRResult(0, rawRate, durationHours, meteorCount, 
                    cloudCorrection, lmCorrection, zenithCorrection, 0, "计算结果超出正常范围");
        }

        double confidence = calculateConfidence(meteorCount, durationHours, cloudCover, limitingMagnitude);
        String notes = generateNotes(meteorCount, durationHours, cloudCover, limitingMagnitude, radiantAltitudeDegrees);

        return new ZHRResult(zhr, rawRate, durationHours, meteorCount,
                cloudCorrection, lmCorrection, zenithCorrection, confidence, notes);
    }

    private static double calculateCloudCorrection(Double cloudCover) {
        if (cloudCover == null || !isValidDouble(cloudCover)) {
            return 1.0;
        }

        double cc = Math.max(0, Math.min(100, cloudCover));
        double fraction = cc / 100.0;

        return 1.0 / (1.0 - fraction * 0.9);
    }

    private static double calculateLimitingMagnitudeCorrection(Double limitingMagnitude) {
        if (limitingMagnitude == null || !isValidDouble(limitingMagnitude)) {
            return 1.0;
        }

        double lm = Math.max(3.0, Math.min(8.0, limitingMagnitude));
        double deltaLM = lm - DEFAULT_LIMITING_MAGNITUDE;

        return Math.pow(POPULATION_INDEX, deltaLM);
    }

    private static double calculateZenithCorrection(Double radiantAltitudeDegrees) {
        if (radiantAltitudeDegrees == null || !isValidDouble(radiantAltitudeDegrees)) {
            return 1.0;
        }

        double alt = Math.max(0, Math.min(90, radiantAltitudeDegrees));
        
        if (alt < 10) {
            return 1.0 / Math.sin(Math.toRadians(30));
        }

        return 1.0 / Math.sin(Math.toRadians(alt));
    }

    private static double calculateConfidence(
            int meteorCount,
            double durationHours,
            Double cloudCover,
            Double limitingMagnitude) {

        double countFactor = Math.min(meteorCount / 20.0, 1.0);
        double durationFactor = Math.min(durationHours / 2.0, 1.0);

        double dataFactor = 0;
        if (cloudCover != null && limitingMagnitude != null) {
            dataFactor = 1.0;
        } else if (cloudCover != null || limitingMagnitude != null) {
            dataFactor = 0.7;
        } else {
            dataFactor = 0.4;
        }

        double confidence = countFactor * 0.4 + durationFactor * 0.3 + dataFactor * 0.3;

        return Math.max(0, Math.min(1, confidence));
    }

    private static String generateNotes(
            int meteorCount,
            double durationHours,
            Double cloudCover,
            Double limitingMagnitude,
            Double radiantAltitude) {

        StringBuilder notes = new StringBuilder();

        if (meteorCount < 5) {
            notes.append("流星数量较少，ZHR估算不确定性较大。");
        } else if (meteorCount < 15) {
            notes.append("流星数量中等，ZHR估算有一定参考价值。");
        } else {
            notes.append("流星数量充足，ZHR估算较为可靠。");
        }

        if (cloudCover == null) {
            notes.append(" 未提供云量，假设晴朗。");
        } else if (cloudCover > 50) {
            notes.append(" 云量较大，已进行云层修正。");
        }

        if (limitingMagnitude == null) {
            notes.append(" 未提供极限星等，使用标准值6.5等。");
        } else if (limitingMagnitude < 5.0) {
            notes.append(" 极限星等较低，可能有光污染。");
        }

        if (radiantAltitude == null || radiantAltitude < 20) {
            notes.append(" 辐射点高度较低或未知，天顶修正可能不准确。");
        }

        return notes.toString();
    }

    private static boolean isValidDouble(double value) {
        return !Double.isNaN(value) && !Double.isInfinite(value);
    }

    public static double estimateRadiantAltitude(
            Double observerLatitude,
            Double observerLongitude,
            Double radiantRA,
            Double radiantDec,
            java.time.LocalDateTime observationTime) {

        if (observerLatitude == null || observerLongitude == null
                || radiantRA == null || radiantDec == null
                || observationTime == null) {
            return null;
        }

        try {
            double jd = julianDate(observationTime);
            double lst = localSiderealTime(jd, observerLongitude);
            double ha = lst - radiantRA;
            while (ha < 0) ha += 360;
            while (ha >= 360) ha -= 360;

            double latRad = Math.toRadians(observerLatitude);
            double decRad = Math.toRadians(radiantDec);
            double haRad = Math.toRadians(ha);

            double sinAlt = Math.sin(latRad) * Math.sin(decRad) +
                    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);

            sinAlt = Math.max(-1, Math.min(1, sinAlt));
            double altitude = Math.toDegrees(Math.asin(sinAlt));

            return Math.max(0, altitude);
        } catch (Exception e) {
            return null;
        }
    }

    private static double julianDate(java.time.LocalDateTime dt) {
        int year = dt.getYear();
        int month = dt.getMonthValue();
        int day = dt.getDayOfMonth();
        double hour = dt.getHour() + dt.getMinute() / 60.0 + dt.getSecond() / 3600.0;

        if (month <= 2) {
            year--;
            month += 12;
        }

        double a = Math.floor(year / 100.0);
        double b = 2 - a + Math.floor(a / 4.0);

        return Math.floor(365.25 * (year + 4716)) +
                Math.floor(30.6001 * (month + 1)) +
                day + hour / 24.0 + b - 1524.5;
    }

    private static double localSiderealTime(double jd, double longitude) {
        double d = jd - 2451545.0;
        double t = d / 36525.0;

        double gst = 280.46061837 + 360.98564736629 * d +
                0.0003032 * t * t - t * t * t / 38710000.0;

        double lst = gst + longitude;

        while (lst < 0) lst += 360;
        while (lst >= 360) lst -= 360;

        return lst;
    }
}
