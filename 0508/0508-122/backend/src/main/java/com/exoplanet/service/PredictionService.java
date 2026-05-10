package com.exoplanet.service;

import com.exoplanet.dto.PredictionRequest;
import com.exoplanet.dto.PredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PredictionService {

    private static final double SOLAR_MASS = 1.989e30;
    private static final double SOLAR_RADIUS = 696340e3;
    private static final double EARTH_RADIUS = 6371e3;
    private static final double AU = 1.496e11;
    private static final double GRAVITATIONAL_CONSTANT = 6.67430e-11;
    private static final double DAYS_PER_YEAR = 365.25;
    private static final double SECONDS_PER_DAY = 24.0 * 3600.0;
    private static final double HOURS_PER_DAY = 24.0;

    public PredictionResponse predictTransit(PredictionRequest request) {
        log.debug("Starting transit prediction with request: {}", request);

        double starMass = request.getStarMass() * SOLAR_MASS;
        double starRadius = request.getStarRadius() * SOLAR_RADIUS;
        double planetRadius = request.getPlanetRadius() * EARTH_RADIUS;
        double semiMajorAxis = request.getPlanetDistance() * AU;
        double inclination = Math.toRadians(request.getInclination());
        double lastTransitTime = request.getLastTransitTime() * SECONDS_PER_DAY;

        double orbitalPeriodSeconds = calculateOrbitalPeriod(starMass, semiMajorAxis);
        double orbitalPeriodDays = orbitalPeriodSeconds / SECONDS_PER_DAY;

        double transitDurationSeconds = calculateTransitDuration(
                starRadius,
                planetRadius,
                semiMajorAxis,
                orbitalPeriodSeconds,
                inclination
        );
        double transitDurationHours = transitDurationSeconds / 3600.0;

        double nextTransitTimeDays = calculateNextTransitTime(
                lastTransitTime,
                orbitalPeriodSeconds
        );

        double impactParameter = calculateImpactParameter(
                semiMajorAxis,
                starRadius,
                inclination
        );

        String habitabilityZone = assessHabitabilityZone(
                semiMajorAxis,
                request.getStarMass()
        );

        String predictionSummary = generatePredictionSummary(
                orbitalPeriodDays,
                transitDurationHours,
                impactParameter,
                habitabilityZone
        );

        return PredictionResponse.builder()
                .orbitalPeriod(orbitalPeriodDays)
                .orbitalPeriodDescription(formatPeriod(orbitalPeriodDays))
                .transitDuration(transitDurationHours)
                .transitDurationDescription(formatDuration(transitDurationHours))
                .nextTransitTime(nextTransitTimeDays)
                .nextTransitTimeDescription(formatNextTransit(nextTransitTimeDays))
                .semiMajorAxis(semiMajorAxis / AU)
                .impactParameter(impactParameter)
                .habitabilityZone(habitabilityZone)
                .predictionSummary(predictionSummary)
                .build();
    }

    private double calculateOrbitalPeriod(double starMass, double semiMajorAxis) {
        double periodSquared = (4 * Math.PI * Math.PI * Math.pow(semiMajorAxis, 3)) /
                (GRAVITATIONAL_CONSTANT * starMass);
        return Math.sqrt(periodSquared);
    }

    private double calculateTransitDuration(double starRadius, double planetRadius,
                                            double semiMajorAxis, double period, double inclination) {
        double cosInclination = Math.cos(inclination);
        double impactParameter = (semiMajorAxis * cosInclination) / starRadius;

        double planetStarRatio = planetRadius / starRadius;
        double semiMajorStarRatio = semiMajorAxis / starRadius;

        double term1 = Math.sqrt(Math.pow(1 + planetStarRatio, 2) - impactParameter * impactParameter);
        double term2 = Math.sqrt(Math.pow(1 - planetStarRatio, 2) - impactParameter * impactParameter);

        double k1 = term1 / (Math.PI * semiMajorStarRatio);
        double k2 = term2 / (Math.PI * semiMajorStarRatio);

        double ingressDuration = (period / (2 * Math.PI)) * Math.asin(k1);
        double egressDuration = ingressDuration;

        double totalDuration = 2 * ingressDuration + (period / Math.PI) * Math.asin(k2);

        return Math.max(0, totalDuration);
    }

    private double calculateImpactParameter(double semiMajorAxis, double starRadius, double inclination) {
        return (semiMajorAxis * Math.cos(inclination)) / starRadius;
    }

    private double calculateNextTransitTime(double lastTransitTimeSeconds, double orbitalPeriodSeconds) {
        double currentTime = System.currentTimeMillis() / 1000.0;

        if (lastTransitTimeSeconds <= 0) {
            lastTransitTimeSeconds = currentTime - (orbitalPeriodSeconds * 0.5);
        }

        double elapsed = currentTime - lastTransitTimeSeconds;
        double periodsSinceLast = Math.floor(elapsed / orbitalPeriodSeconds);
        double nextTransit = lastTransitTimeSeconds + (periodsSinceLast + 1) * orbitalPeriodSeconds;

        double timeUntilNextTransitSeconds = nextTransit - currentTime;
        return timeUntilNextTransitSeconds / SECONDS_PER_DAY;
    }

    private String assessHabitabilityZone(double semiMajorAxis, double starMass) {
        double auDistance = semiMajorAxis / AU;

        double innerHZ = 0.75 * Math.sqrt(starMass);
        double outerHZ = 1.8 * Math.sqrt(starMass);

        if (auDistance < innerHZ) {
            return "太热 🔥 - 距离恒星太近，温度过高";
        } else if (auDistance > outerHZ) {
            return "太冷 ❄️ - 距离恒星太远，温度过低";
        } else {
            return "宜居带 🌍 - 位于恒星的宜居范围内";
        }
    }

    private String formatPeriod(double periodDays) {
        if (periodDays < 1) {
            return String.format("%.2f 小时", periodDays * HOURS_PER_DAY);
        } else if (periodDays < 30) {
            return String.format("%.2f 天", periodDays);
        } else if (periodDays < DAYS_PER_YEAR) {
            return String.format("%.2f 个月 (%.1f 天)", periodDays / 30.44, periodDays);
        } else {
            return String.format("%.2f 年 (%.1f 天)", periodDays / DAYS_PER_YEAR, periodDays);
        }
    }

    private String formatDuration(double durationHours) {
        if (durationHours < 1) {
            return String.format("%.1f 分钟", durationHours * 60);
        } else if (durationHours < 24) {
            return String.format("%.2f 小时", durationHours);
        } else {
            return String.format("%.2f 天 (%.1f 小时)", durationHours / 24, durationHours);
        }
    }

    private String formatNextTransit(double timeUntilNextDays) {
        if (timeUntilNextDays < 0) {
            return "凌星正在进行中";
        } else if (timeUntilNextDays < 1) {
            double hours = timeUntilNextDays * HOURS_PER_DAY;
            if (hours < 1) {
                return String.format("约 %.0f 分钟后", hours * 60);
            }
            return String.format("约 %.1f 小时后", hours);
        } else if (timeUntilNextDays < 7) {
            return String.format("约 %.1f 天后", timeUntilNextDays);
        } else if (timeUntilNextDays < 30) {
            return String.format("约 %.1f 周后", timeUntilNextDays / 7);
        } else {
            return String.format("约 %.1f 个月后", timeUntilNextDays / 30.44);
        }
    }

    private String generatePredictionSummary(double periodDays, double durationHours,
                                              double impactParameter, String habitability) {
        StringBuilder summary = new StringBuilder();

        summary.append("该行星轨道周期为 ").append(formatPeriod(periodDays));
        summary.append("，每次凌星持续约 ").append(formatDuration(durationHours));

        if (impactParameter < 0.3) {
            summary.append("。由于轨道倾角接近 90°，凌星事件非常明显，");
        } else if (impactParameter < 0.7) {
            summary.append("。轨道倾角适中，凌星事件清晰可见，");
        } else if (impactParameter < 0.95) {
            summary.append("。轨道倾角较大，凌星事件较为浅淡，");
        } else {
            summary.append("。警告：轨道倾角太大，可能无法观测到凌星，");
        }

        summary.append("该行星 ").append(habitability).append("。");

        return summary.toString();
    }
}