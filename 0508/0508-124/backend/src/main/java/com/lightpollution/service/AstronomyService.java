package com.lightpollution.service;

import com.lightpollution.entity.Location;
import com.lightpollution.repository.LocationRepository;
import com.lightpollution.util.AstronomyUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class AstronomyService {

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String PREDICTION_CACHE_PREFIX = "prediction:";
    private static final long CACHE_TTL = 6;

    public List<Map<String, Object>> getThreeNightPrediction(double latitude, double longitude) {
        String cacheKey = PREDICTION_CACHE_PREFIX + latitude + ":" + longitude;
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);

        if (cached != null) {
            return cached;
        }

        List<Map<String, Object>> predictions = new ArrayList<>();
        LocalDate today = LocalDate.now();

        Double lightPollutionScore = estimateLightPollution(latitude, longitude);

        for (int i = 0; i < 3; i++) {
            LocalDate date = today.plusDays(i);
            predictions.add(calculateNightPrediction(date, latitude, longitude, lightPollutionScore));
        }

        redisTemplate.opsForValue().set(cacheKey, predictions, CACHE_TTL, TimeUnit.HOURS);
        return predictions;
    }

    private Map<String, Object> calculateNightPrediction(LocalDate date, double latitude,
                                                          double longitude, Double lightPollutionScore) {
        Map<String, Object> prediction = new HashMap<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        prediction.put("date", date.toString());
        prediction.put("dateLabel", getDateLabel(date));

        LocalDateTime sunset = AstronomyUtils.getSunset(date, latitude, longitude);
        LocalDateTime dusk = AstronomyUtils.getAstronomicalDusk(date, latitude, longitude);
        LocalDateTime dawn = AstronomyUtils.getAstronomicalDawn(date.plusDays(1), latitude, longitude);
        LocalDateTime sunrise = AstronomyUtils.getSunrise(date.plusDays(1), latitude, longitude);

        Map<String, String> times = new HashMap<>();
        times.put("sunset", sunset != null ? sunset.format(timeFormatter) : null);
        times.put("astronomicalDusk", dusk != null ? dusk.format(timeFormatter) : null);
        times.put("astronomicalDawn", dawn != null ? dawn.format(timeFormatter) : null);
        times.put("sunrise", sunrise != null ? sunrise.format(timeFormatter) : null);
        prediction.put("times", times);

        double observationHours = AstronomyUtils.getObservationWindowHours(date, latitude, longitude);
        prediction.put("observationHours", round2(observationHours));

        double moonIllumination = AstronomyUtils.getMoonIllumination(date) * 100;
        int moonPhaseIndex = AstronomyUtils.getMoonPhaseIndex(date);
        String moonPhase = AstronomyUtils.getMoonPhaseName(moonPhaseIndex);
        boolean moonUp = AstronomyUtils.isMoonUpDuringObservation(date, latitude, longitude);

        Map<String, Object> moonInfo = new HashMap<>();
        moonInfo.put("illumination", round2(moonIllumination));
        moonInfo.put("phase", moonPhase);
        moonInfo.put("phaseIndex", moonPhaseIndex);
        moonInfo.put("isUpDuringObservation", moonUp);
        prediction.put("moon", moonInfo);

        int overallScore = calculateOverallScore(
            lightPollutionScore,
            observationHours,
            moonIllumination,
            moonUp,
            moonPhaseIndex
        );
        prediction.put("overallScore", overallScore);
        prediction.put("scoreLevel", getScoreLevel(overallScore));
        prediction.put("scoreDescription", getScoreDescription(overallScore));

        List<String> factors = new ArrayList<>();
        factors.addAll(analyzeLightPollutionFactor(lightPollutionScore));
        factors.addAll(analyzeTimeFactor(observationHours));
        factors.addAll(analyzeMoonFactor(moonIllumination, moonUp, moonPhaseIndex));
        prediction.put("factors", factors);

        double optimalMagnitude = estimateOptimalMagnitude(lightPollutionScore, moonIllumination, moonUp);
        prediction.put("estimatedLimitingMagnitude", round2(optimalMagnitude));

        return prediction;
    }

    private Double estimateLightPollution(double latitude, double longitude) {
        BigDecimal lat = BigDecimal.valueOf(latitude);
        BigDecimal lng = BigDecimal.valueOf(longitude);
        BigDecimal tolerance = new BigDecimal("0.5");

        List<Location> nearby = locationRepository.findByBoundingBox(
            lat.subtract(tolerance),
            lat.add(tolerance),
            lng.subtract(tolerance),
            lng.add(tolerance)
        );

        if (nearby.isEmpty()) {
            return null;
        }

        double totalWeighted = 0;
        double totalWeight = 0;

        for (Location loc : nearby) {
            double dist = haversineDistance(
                latitude, longitude,
                loc.getLatitude().doubleValue(),
                loc.getLongitude().doubleValue()
            );

            double weight = 1.0 / (1.0 + dist * 2);
            double mag = loc.getAverageMagnitude() != null
                ? loc.getAverageMagnitude().doubleValue()
                : (loc.getLatestMagnitude() != null ? loc.getLatestMagnitude() : 3.5);

            totalWeighted += mag * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? totalWeighted / totalWeight : null;
    }

    private int calculateOverallScore(Double lightPollutionScore, double observationHours,
                                       double moonIllumination, boolean moonUp, int moonPhaseIndex) {
        double baseScore = 5.0;

        if (lightPollutionScore != null) {
            double lpScore = (lightPollutionScore - 1) / 5.0 * 10;
            baseScore += lpScore * 0.4;
        } else {
            baseScore += 2.0;
        }

        double timeScore = Math.min(observationHours / 8.0, 1.0) * 2.0;
        baseScore += timeScore;

        double moonPenalty = 0;
        if (moonUp) {
            if (moonIllumination > 80) {
                moonPenalty = 2.5;
            } else if (moonIllumination > 50) {
                moonPenalty = 1.5;
            } else if (moonIllumination > 20) {
                moonPenalty = 0.8;
            } else {
                moonPenalty = 0.3;
            }
        }
        baseScore -= moonPenalty;

        int score = (int) Math.round(baseScore);
        return Math.max(1, Math.min(10, score));
    }

    private String getScoreLevel(int score) {
        if (score >= 9) return "EXCELLENT";
        if (score >= 7) return "GOOD";
        if (score >= 5) return "FAIR";
        if (score >= 3) return "POOR";
        return "VERY_POOR";
    }

    private String getScoreDescription(int score) {
        if (score >= 9) return "绝佳观测条件！几乎没有月光影响，暗夜质量优秀";
        if (score >= 7) return "良好观测条件，可以观测深空天体";
        if (score >= 5) return "一般条件，适合亮星和行星观测";
        if (score >= 3) return "较差条件，建议推迟观测";
        return "非常差，可能有强月光或严重光污染";
    }

    private List<String> analyzeLightPollutionFactor(Double lightPollutionScore) {
        List<String> factors = new ArrayList<>();
        if (lightPollutionScore == null) {
            factors.add("⚠️ 附近暂无观测数据，无法准确评估光污染");
            return factors;
        }
        if (lightPollutionScore >= 5) {
            factors.add("✨ 光污染极低，有望远镜级别的暗夜条件");
        } else if (lightPollutionScore >= 4) {
            factors.add("🌙 光污染较轻，郊区或乡村暗夜条件");
        } else if (lightPollutionScore >= 3) {
            factors.add("🏙️ 中等光污染，城市边缘或近郊");
        } else {
            factors.add("💡 光污染严重，市中心或工业区");
        }
        return factors;
    }

    private List<String> analyzeTimeFactor(double observationHours) {
        List<String> factors = new ArrayList<>();
        if (observationHours >= 7) {
            factors.add("⏰ 观测窗口充足（" + round2(observationHours) + "小时）");
        } else if (observationHours >= 5) {
            factors.add("⏰ 观测窗口较长（" + round2(observationHours) + "小时）");
        } else if (observationHours >= 3) {
            factors.add("⏰ 观测窗口一般（" + round2(observationHours) + "小时）");
        } else {
            factors.add("⏰ 观测窗口较短（" + round2(observationHours) + "小时）");
        }
        return factors;
    }

    private List<String> analyzeMoonFactor(double moonIllumination, boolean moonUp, int moonPhaseIndex) {
        List<String> factors = new ArrayList<>();

        if (!moonUp) {
            factors.add("🌑 月亮在地平线下，无月光干扰");
            return factors;
        }

        if (moonPhaseIndex == 0) {
            factors.add("🌑 新月，几乎无月光影响");
        } else if (moonPhaseIndex == 4) {
            factors.add("🌕 满月，月光影响最大");
            if (moonIllumination > 80) {
                factors.add("💡 强月光：亮星可见，深空观测困难");
            }
        } else if (moonPhaseIndex == 2 || moonPhaseIndex == 6) {
            factors.add("🌓 半月，月光影响中等");
        } else if (moonIllumination > 50) {
            factors.add("🌔 月光较亮（" + round2(moonIllumination) + "%）");
        } else if (moonIllumination > 20) {
            factors.add("🌒 月光较弱（" + round2(moonIllumination) + "%）");
        } else {
            factors.add("🌑 月光微弱（" + round2(moonIllumination) + "%）");
        }

        return factors;
    }

    private double estimateOptimalMagnitude(Double lightPollutionScore, double moonIllumination, boolean moonUp) {
        double baseMag = lightPollutionScore != null ? lightPollutionScore : 3.5;

        if (moonUp && moonIllumination > 50) {
            baseMag -= 1.0;
        } else if (moonUp && moonIllumination > 20) {
            baseMag -= 0.5;
        }

        return Math.max(1.0, Math.min(6.5, baseMag));
    }

    private String getDateLabel(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date.equals(today)) return "今晚";
        if (date.equals(today.plusDays(1))) return "明晚";
        if (date.equals(today.plusDays(2))) return "后晚";
        return date.getDayOfWeek().toString();
    }

    private double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
