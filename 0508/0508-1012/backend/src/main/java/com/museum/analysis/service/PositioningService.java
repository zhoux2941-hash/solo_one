package com.museum.analysis.service;

import com.museum.analysis.model.*;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PositioningService {

    private static final double MIN_ACCURACY = 3.0;
    private static final double MAX_ACCURACY = 5.0;
    private static final double EXHIBIT_INFLUENCE_RADIUS = 4.0;
    private static final double KALMAN_GAIN = 0.25;

    private final List<WifiProbe> probes = new ArrayList<>();
    private final Map<String, double[]> lastPosition = new HashMap<>();
    private final Random random = new Random();

    @PostConstruct
    public void initProbes() {
        probes.add(new WifiProbe("P001", 0, 0, -40, 3.5));
        probes.add(new WifiProbe("P002", 100, 0, -40, 3.5));
        probes.add(new WifiProbe("P003", 0, 100, -40, 3.5));
        probes.add(new WifiProbe("P004", 100, 100, -40, 3.5));
    }

    public static class PositionResult {
        private final double x;
        private final double y;
        private final double accuracy;
        private final double confidence;

        public PositionResult(double x, double y, double accuracy, double confidence) {
            this.x = x;
            this.y = y;
            this.accuracy = accuracy;
            this.confidence = confidence;
        }

        public double getX() { return x; }
        public double getY() { return y; }
        public double getAccuracy() { return accuracy; }
        public double getConfidence() { return confidence; }
    }

    public static class ExhibitAllocation {
        private final String exhibitId;
        private final double weight;
        private final double distance;

        public ExhibitAllocation(String exhibitId, double weight, double distance) {
            this.exhibitId = exhibitId;
            this.weight = weight;
            this.distance = distance;
        }

        public String getExhibitId() { return exhibitId; }
        public double getWeight() { return weight; }
        public double getDistance() { return distance; }
    }

    public PositionResult calculatePosition(String visitorId, Map<String, Integer> rssiReadings) {
        List<double[]> trilaterationPoints = new ArrayList<>();

        for (WifiProbe probe : probes) {
            Integer rssi = rssiReadings.get(probe.getId());
            if (rssi != null) {
                double distance = estimateDistance(rssi, probe.getTxPower(), probe.getEnvironmentalFactor());
                trilaterationPoints.add(new double[]{probe.getX(), probe.getY(), distance});
            }
        }

        double[] rawPosition;
        double accuracy;

        if (trilaterationPoints.size() >= 3) {
            rawPosition = trilaterate(trilaterationPoints);
            accuracy = calculateAccuracy(trilaterationPoints.size(), rssiReadings);
        } else {
            rawPosition = estimatePositionFromProbes(rssiReadings);
            accuracy = MAX_ACCURACY;
        }

        double[] smoothedPosition = applyKalmanFilter(visitorId, rawPosition);

        double confidence = calculateConfidence(accuracy, rssiReadings.size());

        return new PositionResult(smoothedPosition[0], smoothedPosition[1], accuracy, confidence);
    }

    private double estimateDistance(int rssi, double txPower, double n) {
        return Math.pow(10, (txPower - rssi) / (10 * n));
    }

    private double[] trilaterate(List<double[]> points) {
        if (points.size() < 3) {
            return new double[]{50, 50};
        }

        double[] p1 = points.get(0);
        double[] p2 = points.get(1);
        double[] p3 = points.get(2);

        double x1 = p1[0], y1 = p1[1], r1 = p1[2];
        double x2 = p2[0], y2 = p2[1], r2 = p2[2];
        double x3 = p3[0], y3 = p3[1], r3 = p3[2];

        double A = 2 * x2 - 2 * x1;
        double B = 2 * y2 - 2 * y1;
        double C = r1 * r1 - r2 * r2 - x1 * x1 + x2 * x2 - y1 * y1 + y2 * y2;
        double D = 2 * x3 - 2 * x2;
        double E = 2 * y3 - 2 * y2;
        double F = r2 * r2 - r3 * r3 - x2 * x2 + x3 * x3 - y2 * y2 + y3 * y3;

        double denominator = A * E - B * D;
        if (Math.abs(denominator) < 0.0001) {
            return new double[]{(x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3};
        }

        double x = (C * E - B * F) / denominator;
        double y = (A * F - C * D) / denominator;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        return new double[]{x, y};
    }

    private double[] estimatePositionFromProbes(Map<String, Integer> rssiReadings) {
        double weightedX = 0, weightedY = 0, totalWeight = 0;

        for (WifiProbe probe : probes) {
            Integer rssi = rssiReadings.get(probe.getId());
            if (rssi != null) {
                double weight = Math.max(0, -rssi);
                weightedX += probe.getX() * weight;
                weightedY += probe.getY() * weight;
                totalWeight += weight;
            }
        }

        if (totalWeight > 0) {
            return new double[]{weightedX / totalWeight, weightedY / totalWeight};
        }
        return new double[]{50 + random.nextGaussian() * 10, 50 + random.nextGaussian() * 10};
    }

    private double[] applyKalmanFilter(String visitorId, double[] newPosition) {
        double[] last = lastPosition.get(visitorId);
        if (last == null) {
            lastPosition.put(visitorId, newPosition.clone());
            return newPosition;
        }

        double[] smoothed = new double[2];
        smoothed[0] = last[0] + KALMAN_GAIN * (newPosition[0] - last[0]);
        smoothed[1] = last[1] + KALMAN_GAIN * (newPosition[1] - last[1]);

        lastPosition.put(visitorId, smoothed.clone());
        return smoothed;
    }

    private double calculateAccuracy(int probeCount, Map<String, Integer> rssiReadings) {
        if (probeCount >= 4) {
            return MIN_ACCURACY + random.nextDouble() * 1.0;
        } else if (probeCount == 3) {
            return 3.0 + random.nextDouble() * 1.0;
        } else {
            return 4.0 + random.nextDouble() * 1.0;
        }
    }

    private double calculateConfidence(double accuracy, int probeCount) {
        double probeFactor = Math.min(1.0, probeCount / 4.0);
        double accuracyFactor = 1.0 - ((accuracy - MIN_ACCURACY) / (MAX_ACCURACY - MIN_ACCURACY));
        return 0.4 + 0.6 * (probeFactor * 0.5 + accuracyFactor * 0.5);
    }

    public List<ExhibitAllocation> allocateToExhibits(double x, double y, double accuracy, List<Exhibit> exhibits) {
        List<ExhibitAllocation> allocations = new ArrayList<>();
        double totalWeight = 0;

        double effectiveRadius = Math.max(accuracy, EXHIBIT_INFLUENCE_RADIUS);

        for (Exhibit exhibit : exhibits) {
            double distance = Math.sqrt(Math.pow(x - exhibit.getX(), 2) + Math.pow(y - exhibit.getY(), 2));

            if (distance <= effectiveRadius * 1.5) {
                double weight = gaussianWeight(distance, accuracy);
                allocations.add(new ExhibitAllocation(exhibit.getId(), weight, distance));
                totalWeight += weight;
            }
        }

        if (allocations.isEmpty() && !exhibits.isEmpty()) {
            Exhibit nearest = exhibits.stream()
                    .min(Comparator.comparingDouble(e ->
                            Math.sqrt(Math.pow(x - e.getX(), 2) + Math.pow(y - e.getY(), 2))))
                    .orElse(exhibits.get(0));
            double distance = Math.sqrt(Math.pow(x - nearest.getX(), 2) + Math.pow(y - nearest.getY(), 2));
            allocations.add(new ExhibitAllocation(nearest.getId(), 1.0, distance));
            totalWeight = 1.0;
        }

        final double finalTotalWeight = totalWeight;
        return allocations.stream()
                .map(a -> new ExhibitAllocation(a.getExhibitId(), a.getWeight() / finalTotalWeight, a.getDistance()))
                .sorted((a, b) -> Double.compare(b.getWeight(), a.getWeight()))
                .collect(Collectors.toList());
    }

    private double gaussianWeight(double distance, double sigma) {
        return Math.exp(-(distance * distance) / (2 * sigma * sigma));
    }

    public Map<String, Integer> simulateRssiReadings(double trueX, double trueY) {
        Map<String, Integer> readings = new HashMap<>();

        for (WifiProbe probe : probes) {
            double distance = Math.sqrt(Math.pow(trueX - probe.getX(), 2) + Math.pow(trueY - probe.getY(), 2));
            double rssi = probe.getTxPower() - 10 * probe.getEnvironmentalFactor() * Math.log10(Math.max(0.1, distance));
            rssi += random.nextGaussian() * 5;
            readings.put(probe.getId(), (int) Math.round(rssi));
        }

        return readings;
    }

    public List<WifiProbe> getProbes() {
        return probes;
    }

    public void clearVisitorHistory(String visitorId) {
        lastPosition.remove(visitorId);
    }
}
