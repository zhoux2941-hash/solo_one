package com.exoplanet.service;

import com.exoplanet.dto.TransitRequest;
import com.exoplanet.dto.TransitResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.distribution.NormalDistribution;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
public class TransitService {

    private static final double SOLAR_RADIUS = 696340.0;
    private static final double EARTH_RADIUS = 6371.0;
    private static final double AU = 149597870.7;
    private static final double GRAVITATIONAL_CONSTANT = 6.67430e-11;
    private static final double SOLAR_MASS = 1.989e30;

    private static final int LD_INTEGRATION_STEPS = 200;
    private static final int TRANSIT_INTEGRATION_STEPS = 100;

    public TransitResponse simulateTransit(TransitRequest request) {
        log.debug("Starting transit simulation with request: {}", request);

        double starRadius = request.getStarRadius() * SOLAR_RADIUS;
        double planetRadius = request.getPlanetRadius() * EARTH_RADIUS;
        double period = request.getOrbitalPeriod() * 24.0 * 3600.0;
        double inclination = Math.toRadians(request.getInclination());

        double starMass = estimateStarMass(request.getStarTemperature(), request.getStarRadius());
        double semiMajorAxis = calculateSemiMajorAxis(period, starMass);
        double transitDepth = calculateTransitDepth(planetRadius, starRadius);
        double transitDuration = calculateTransitDuration(starRadius, planetRadius, semiMajorAxis, period, inclination);

        double totalDuration = request.getNumPeriods() * request.getOrbitalPeriod() * 24.0;
        List<Double> time = new ArrayList<>();
        List<Double> flux = new ArrayList<>();

        double timeStep = totalDuration / (request.getNumPoints() - 1);

        for (int i = 0; i < request.getNumPoints(); i++) {
            double t = i * timeStep;
            time.add(t);
            double f = calculateTransitFlux(t, request.getOrbitalPeriod() * 24.0, starRadius, planetRadius,
                    semiMajorAxis, inclination);
            flux.add(f);
        }

        List<Double> fluxWithNoise = new ArrayList<>(flux);
        if (request.getNoiseLevel() > 0) {
            fluxWithNoise = addNoise(flux, request.getNoiseLevel() * transitDepth);
        }

        String starType = classifyStar(request.getStarTemperature(), request.getStarRadius());

        return TransitResponse.builder()
                .time(time)
                .flux(flux)
                .fluxWithNoise(fluxWithNoise)
                .transitDepth(transitDepth)
                .transitDuration(transitDuration)
                .starType(starType)
                .build();
    }

    public List<Double> generateFitCurve(double starRadius, double starTemperature,
                                          double planetRadius, double orbitalPeriod,
                                          double inclination, int numPoints, int numPeriods) {
        double starR = starRadius * SOLAR_RADIUS;
        double planetR = planetRadius * EARTH_RADIUS;
        double period = orbitalPeriod * 24.0 * 3600.0;
        double incl = Math.toRadians(inclination);

        double starMass = estimateStarMass(starTemperature, starRadius);
        double semiMajorAxis = calculateSemiMajorAxis(period, starMass);

        double totalDuration = numPeriods * orbitalPeriod * 24.0;
        List<Double> flux = new ArrayList<>();
        double timeStep = totalDuration / (numPoints - 1);

        for (int i = 0; i < numPoints; i++) {
            double t = i * timeStep;
            double f = calculateTransitFlux(t, orbitalPeriod * 24.0, starR, planetR, semiMajorAxis, incl);
            flux.add(f);
        }

        return flux;
    }

    public List<Double> generateTimeAxis(double orbitalPeriod, int numPoints, int numPeriods) {
        double totalDuration = numPeriods * orbitalPeriod * 24.0;
        List<Double> time = new ArrayList<>();
        double timeStep = totalDuration / (numPoints - 1);

        for (int i = 0; i < numPoints; i++) {
            time.add(i * timeStep);
        }

        return time;
    }

    private double estimateStarMass(double temperature, double radius) {
        double tempRatio = temperature / 5778.0;
        double radiusRatio = radius;
        double massEstimate = Math.pow(radiusRatio, 1.0 / 3.0) * tempRatio * SOLAR_MASS;
        return Math.max(0.1 * SOLAR_MASS, Math.min(10 * SOLAR_MASS, massEstimate));
    }

    private double calculateSemiMajorAxis(double period, double starMass) {
        return Math.pow((GRAVITATIONAL_CONSTANT * starMass * period * period) / (4 * Math.PI * Math.PI), 1.0 / 3.0);
    }

    private double calculateTransitDepth(double planetRadius, double starRadius) {
        return Math.pow(planetRadius / starRadius, 2);
    }

    private double calculateTransitDuration(double starRadius, double planetRadius,
                                            double semiMajorAxis, double period, double inclination) {
        double impactParameter = (semiMajorAxis * Math.cos(inclination)) / starRadius;
        double durationRatio = Math.sqrt(Math.pow(1 + planetRadius / starRadius, 2) - impactParameter * impactParameter);
        double transitDurationHours = (period / (2 * Math.PI)) * Math.asin(durationRatio) / 3600.0;
        return Math.max(0, transitDurationHours);
    }

    private double calculateTransitFlux(double time, double periodHours, double starRadius,
                                        double planetRadius, double semiMajorAxis, double inclination) {
        double period = periodHours * 3600.0;
        double t = time * 3600.0;
        double phase = (2 * Math.PI * t) / period;

        double x = semiMajorAxis * Math.sin(phase) * Math.cos(inclination);
        double y = semiMajorAxis * Math.sin(phase) * Math.sin(inclination);

        double separation = Math.sqrt(x * x + y * y);

        return numericalLimbDarkeningFlux(starRadius, planetRadius, separation);
    }

    private double numericalLimbDarkeningFlux(double starRadius, double planetRadius, double separation) {
        double p = planetRadius / starRadius;
        double z = separation / starRadius;

        if (z >= 1.0 + p) {
            return 1.0;
        }

        double[] ldCoeffs = getLimbDarkeningCoefficients();
        double u1 = ldCoeffs[0];
        double u2 = ldCoeffs[1];

        double totalFlux = 0.0;
        double blockedFlux = 0.0;

        double dr = 1.0 / LD_INTEGRATION_STEPS;

        for (int i = 0; i < LD_INTEGRATION_STEPS; i++) {
            double r = (i + 0.5) * dr;
            double dTheta = 2 * Math.PI / TRANSIT_INTEGRATION_STEPS;

            for (int j = 0; j < TRANSIT_INTEGRATION_STEPS; j++) {
                double theta = (j + 0.5) * dTheta;

                double x = r * Math.cos(theta);
                double y = r * Math.sin(theta);

                double intensity = getIntensity(r, u1, u2);
                double areaElement = r * dr * dTheta;
                totalFlux += intensity * areaElement;

                double dx = x - z;
                double dy = y;
                double distToPlanetCenter = Math.sqrt(dx * dx + dy * dy);

                if (distToPlanetCenter < p) {
                    blockedFlux += intensity * areaElement;
                }
            }
        }

        if (totalFlux > 0) {
            return (totalFlux - blockedFlux) / totalFlux;
        }

        return 1.0;
    }

    private double getIntensity(double r, double u1, double u2) {
        if (r >= 1.0) {
            return 0.0;
        }

        double mu = Math.sqrt(1.0 - r * r);
        return 1.0 - u1 * (1.0 - mu) - u2 * (1.0 - mu) * (1.0 - mu);
    }

    private double[] getLimbDarkeningCoefficients() {
        return new double[]{0.4, 0.2};
    }

    private List<Double> addNoise(List<Double> data, double noiseAmplitude) {
        List<Double> noisyData = new ArrayList<>();
        Random random = new Random(42);
        NormalDistribution normalDist = new NormalDistribution(0, noiseAmplitude);

        for (double value : data) {
            double noise = normalDist.sample();
            noisyData.add(Math.max(0, Math.min(1.0, value + noise)));
        }

        return noisyData;
    }

    private String classifyStar(double temperature, double radius) {
        if (temperature > 30000) {
            return radius > 10 ? "蓝超巨星 (O型)" : "蓝巨星 (O型)";
        } else if (temperature > 10000) {
            return radius > 10 ? "蓝白超巨星 (B型)" : "蓝白星 (B型)";
        } else if (temperature > 7500) {
            return radius > 10 ? "白超巨星 (A型)" : "白星 (A型)";
        } else if (temperature > 6000) {
            return radius > 10 ? "黄白超巨星 (F型)" : "黄白星 (F型)";
        } else if (temperature > 5000) {
            return radius > 10 ? "黄超巨星 (G型)" : "类太阳星 (G型)";
        } else if (temperature > 3500) {
            return radius > 10 ? "红超巨星 (K型)" : "橙星 (K型)";
        } else {
            return radius > 10 ? "红超巨星 (M型)" : "红矮星 (M型)";
        }
    }
}