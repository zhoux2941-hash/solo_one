package com.meteor.util;

import java.util.ArrayList;
import java.util.List;

public class ConstellationMapper {

    private static class ConstellationBoundary {
        String name;
        String chineseName;
        double minRA, maxRA, minDec, maxDec;

        ConstellationBoundary(String name, String chineseName, double minRA, double maxRA, double minDec, double maxDec) {
            this.name = name;
            this.chineseName = chineseName;
            this.minRA = minRA;
            this.maxRA = maxRA;
            this.minDec = minDec;
            this.maxDec = maxDec;
        }

        boolean contains(double ra, double dec) {
            return ra >= minRA && ra <= maxRA && dec >= minDec && dec <= maxDec;
        }
    }

    private static final List<ConstellationBoundary> CONSTELLATIONS = new ArrayList<>();

    static {
        CONSTELLATIONS.add(new ConstellationBoundary("Orion", "猎户座", 75, 90, -10, 20));
        CONSTELLATIONS.add(new ConstellationBoundary("Canis Major", "大犬座", 90, 115, -50, -10));
        CONSTELLATIONS.add(new ConstellationBoundary("Taurus", "金牛座", 40, 75, 0, 35));
        CONSTELLATIONS.add(new ConstellationBoundary("Gemini", "双子座", 95, 125, 10, 35));
        CONSTELLATIONS.add(new ConstellationBoundary("Leo", "狮子座", 135, 180, -10, 35));
        CONSTELLATIONS.add(new ConstellationBoundary("Ursa Major", "大熊座", 150, 250, 28, 90));
        CONSTELLATIONS.add(new ConstellationBoundary("Ursa Minor", "小熊座", 0, 360, 60, 90));
        CONSTELLATIONS.add(new ConstellationBoundary("Lyra", "天琴座", 270, 295, 25, 48));
        CONSTELLATIONS.add(new ConstellationBoundary("Cygnus", "天鹅座", 290, 320, 25, 65));
        CONSTELLATIONS.add(new ConstellationBoundary("Aquarius", "宝瓶座", 305, 355, -25, 3));
        CONSTELLATIONS.add(new ConstellationBoundary("Pegasus", "飞马座", 320, 360, 2, 35));
        CONSTELLATIONS.add(new ConstellationBoundary("Perseus", "英仙座", 20, 70, 30, 60));
        CONSTELLATIONS.add(new ConstellationBoundary("Cassiopeia", "仙后座", 0, 85, 45, 78));
        CONSTELLATIONS.add(new ConstellationBoundary("Draco", "天龙座", 120, 220, 50, 85));
        CONSTELLATIONS.add(new ConstellationBoundary("Hercules", "武仙座", 220, 265, -5, 50));
        CONSTELLATIONS.add(new ConstellationBoundary("Virgo", "室女座", 170, 215, -25, 15));
        CONSTELLATIONS.add(new ConstellationBoundary("Libra", "天秤座", 215, 240, -30, 0));
        CONSTELLATIONS.add(new ConstellationBoundary("Scorpius", "天蝎座", 230, 265, -45, 0));
        CONSTELLATIONS.add(new ConstellationBoundary("Sagittarius", "人马座", 255, 300, -45, -10));
        CONSTELLATIONS.add(new ConstellationBoundary("Capricornus", "摩羯座", 295, 325, -35, -10));
        CONSTELLATIONS.add(new ConstellationBoundary("Aries", "白羊座", 20, 55, 0, 30));
        CONSTELLATIONS.add(new ConstellationBoundary("Cancer", "巨蟹座", 115, 140, 5, 30));
        CONSTELLATIONS.add(new ConstellationBoundary("Bootes", "牧夫座", 195, 240, 0, 55));
        CONSTELLATIONS.add(new ConstellationBoundary("Ophiuchus", "蛇夫座", 235, 270, -30, 20));
    }

    public static String getConstellation(double ra, double dec) {
        for (ConstellationBoundary c : CONSTELLATIONS) {
            if (c.contains(ra, dec)) {
                return c.name;
            }
        }

        double minDist = Double.MAX_VALUE;
        String closest = "Unknown";

        for (ConstellationBoundary c : CONSTELLATIONS) {
            double centerRA = (c.minRA + c.maxRA) / 2;
            double centerDec = (c.minDec + c.maxDec) / 2;
            double dist = angularDistance(ra, dec, centerRA, centerDec);

            if (dist < minDist) {
                minDist = dist;
                closest = c.name;
            }
        }

        return closest;
    }

    private static double angularDistance(double ra1, double dec1, double ra2, double dec2) {
        double dRA = Math.toRadians(Math.abs(ra1 - ra2));
        if (dRA > Math.PI) dRA = 2 * Math.PI - dRA;
        double dDec = Math.toRadians(Math.abs(dec1 - dec2));

        double a = Math.sin(dDec / 2) * Math.sin(dDec / 2) +
                Math.cos(Math.toRadians(dec1)) * Math.cos(Math.toRadians(dec2)) *
                        Math.sin(dRA / 2) * Math.sin(dRA / 2);

        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public static List<ConstellationOption> getAllConstellations() {
        List<ConstellationOption> options = new ArrayList<>();
        for (ConstellationBoundary c : CONSTELLATIONS) {
            options.add(new ConstellationOption(c.name, c.chineseName));
        }
        return options;
    }

    public static class ConstellationOption {
        public String name;
        public String chineseName;

        public ConstellationOption(String name, String chineseName) {
            this.name = name;
            this.chineseName = chineseName;
        }

        public String getName() { return name; }
        public String getChineseName() { return chineseName; }
    }
}
