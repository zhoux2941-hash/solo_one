package com.museum.analysis.service;

import com.museum.analysis.model.*;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GazeTrackingService {

    private static final double GAZE_CONFIDENCE_THRESHOLD = 0.6;
    private static final double PASSING_BY_THRESHOLD = 0.2;
    private static final int MIN_GAZE_SAMPLES = 3;

    private final List<Camera> cameras = new ArrayList<>();
    private final Map<String, List<GazeRecord>> visitorGazeHistory = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @PostConstruct
    public void initCameras() {
        cameras.add(new Camera("CAM001", "A区摄像头", 50, 0, 90, 180, true));
        cameras.add(new Camera("CAM002", "B区摄像头", 50, 100, 90, 0, true));
        cameras.add(new Camera("CAM003", "入口摄像头", 50, 30, 60, 270, true));
        cameras.add(new Camera("CAM004", "出口摄像头", 50, 70, 60, 90, true));
    }

    public static class GazeAnalysisResult {
        private final double gazeDuration;
        private final double gazeRatio;
        private final double effectiveDuration;
        private final boolean isPassingBy;
        private final int gazeSampleCount;

        public GazeAnalysisResult(double gazeDuration, double gazeRatio, double effectiveDuration,
                                  boolean isPassingBy, int gazeSampleCount) {
            this.gazeDuration = gazeDuration;
            this.gazeRatio = gazeRatio;
            this.effectiveDuration = effectiveDuration;
            this.isPassingBy = isPassingBy;
            this.gazeSampleCount = gazeSampleCount;
        }

        public double getGazeDuration() { return gazeDuration; }
        public double getGazeRatio() { return gazeRatio; }
        public double getEffectiveDuration() { return effectiveDuration; }
        public boolean isPassingBy() { return isPassingBy; }
        public int getGazeSampleCount() { return gazeSampleCount; }
    }

    public GazeRecord simulateGazeSample(String visitorId, Exhibit exhibit,
                                         double visitorX, double visitorY, long timestamp) {
        Camera bestCamera = findBestCamera(visitorX, visitorY);
        if (bestCamera == null) {
            return null;
        }

        double[] gazeDirection = simulateGazeDirection(visitorX, visitorY, exhibit);

        boolean isLookingAtExhibit = isLookingAtExhibit(visitorX, visitorY, gazeDirection[0], gazeDirection[1], exhibit);

        double gazeConfidence = calculateGazeConfidence(visitorX, visitorY, bestCamera);
        double gazeDuration = 0.2 + random.nextDouble() * 1.5;

        GazeRecord record = new GazeRecord(
                visitorId,
                exhibit.getId(),
                timestamp,
                gazeDirection[0],
                gazeDirection[1],
                gazeConfidence,
                gazeDuration,
                isLookingAtExhibit,
                bestCamera.getId()
        );

        visitorGazeHistory.computeIfAbsent(visitorId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(record);

        if (visitorGazeHistory.get(visitorId).size() > 100) {
            visitorGazeHistory.get(visitorId).remove(0);
        }

        return record;
    }

    private Camera findBestCamera(double x, double y) {
        Camera best = null;
        double bestScore = -1;

        for (Camera camera : cameras) {
            if (!camera.isActive()) continue;

            double distance = Math.sqrt(Math.pow(x - camera.getX(), 2) + Math.pow(y - camera.getY(), 2));
            if (distance > 60) continue;

            double angleToVisitor = Math.toDegrees(Math.atan2(y - camera.getY(), x - camera.getX()));
            double angleDiff = Math.abs(normalizeAngle(angleToVisitor - camera.getDirection()));
            if (angleDiff > camera.getFov() / 2) continue;

            double score = 1 - (distance / 60) * 0.5 - (angleDiff / (camera.getFov() / 2)) * 0.5;
            if (score > bestScore) {
                bestScore = score;
                best = camera;
            }
        }

        return best;
    }

    private double[] simulateGazeDirection(double visitorX, double visitorY, Exhibit exhibit) {
        double directionX, directionY;

        double baseAngle = Math.atan2(exhibit.getY() - visitorY, exhibit.getX() - visitorX);

        double noise = random.nextGaussian() * 0.5;
        double finalAngle = baseAngle + noise;

        directionX = Math.cos(finalAngle);
        directionY = Math.sin(finalAngle);

        return new double[]{directionX, directionY};
    }

    private boolean isLookingAtExhibit(double visitorX, double visitorY,
                                       double dirX, double dirY, Exhibit exhibit) {
        double toExhibitX = exhibit.getX() - visitorX;
        double toExhibitY = exhibit.getY() - visitorY;

        double distance = Math.sqrt(toExhibitX * toExhibitX + toExhibitY * toExhibitY);
        if (distance < 0.1) return true;

        double normalizedToX = toExhibitX / distance;
        double normalizedToY = toExhibitY / distance;

        double dotProduct = dirX * normalizedToX + dirY * normalizedToY;
        double angleDiff = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

        double angleThreshold = Math.atan2(3, Math.max(1, distance));

        return angleDiff < angleThreshold;
    }

    private double calculateGazeConfidence(double x, double y, Camera camera) {
        double distance = Math.sqrt(Math.pow(x - camera.getX(), 2) + Math.pow(y - camera.getY(), 2));
        double distanceFactor = Math.max(0, 1 - distance / 80);
        double noiseFactor = 0.7 + random.nextDouble() * 0.3;
        return Math.min(1, distanceFactor * noiseFactor);
    }

    private double normalizeAngle(double angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }

    public GazeAnalysisResult analyzeVisitorGaze(String visitorId, String exhibitId, int totalDuration) {
        List<GazeRecord> history = visitorGazeHistory.getOrDefault(visitorId, Collections.emptyList());

        List<GazeRecord> relevantRecords = new ArrayList<>();
        for (GazeRecord record : history) {
            if (exhibitId.equals(record.getExhibitId()) && record.getGazeConfidence() >= GAZE_CONFIDENCE_THRESHOLD) {
                relevantRecords.add(record);
            }
        }

        int gazeSampleCount = relevantRecords.size();

        double totalGazeDuration = relevantRecords.stream()
                .filter(GazeRecord::isLookingAtExhibit)
                .mapToDouble(GazeRecord::getGazeDuration)
                .sum();

        double gazeRatio = totalDuration > 0 ? Math.min(1, totalGazeDuration / totalDuration) : 0;

        boolean isPassingBy = gazeSampleCount < MIN_GAZE_SAMPLES || gazeRatio < PASSING_BY_THRESHOLD;

        double gazeWeight = calculateGazeWeight(gazeRatio, gazeSampleCount);
        double effectiveDuration = totalDuration * gazeWeight;

        return new GazeAnalysisResult(
                Math.round(totalGazeDuration * 10) / 10.0,
                Math.round(gazeRatio * 100) / 100.0,
                Math.round(effectiveDuration * 10) / 10.0,
                isPassingBy,
                gazeSampleCount
        );
    }

    private double calculateGazeWeight(double gazeRatio, int sampleCount) {
        if (sampleCount < MIN_GAZE_SAMPLES) {
            return 0.5;
        }

        if (gazeRatio >= 0.7) {
            return 1.2;
        } else if (gazeRatio >= 0.4) {
            return 1.0;
        } else if (gazeRatio >= 0.2) {
            return 0.7;
        } else {
            return 0.3;
        }
    }

    public Map<String, Object> getGazeStats() {
        Map<String, Object> stats = new HashMap<>();

        int totalRecords = 0;
        int lookingRecords = 0;
        double totalConfidence = 0;
        int visitorCount = visitorGazeHistory.size();

        for (List<GazeRecord> records : visitorGazeHistory.values()) {
            totalRecords += records.size();
            for (GazeRecord record : records) {
                if (record.isLookingAtExhibit()) {
                    lookingRecords++;
                }
                totalConfidence += record.getGazeConfidence();
            }
        }

        double avgConfidence = totalRecords > 0 ? totalConfidence / totalRecords : 0;
        double lookingRatio = totalRecords > 0 ? (double) lookingRecords / totalRecords : 0;

        stats.put("activeCameras", cameras.stream().filter(Camera::isActive).count());
        stats.put("totalCameras", cameras.size());
        stats.put("trackedVisitors", visitorCount);
        stats.put("totalGazeRecords", totalRecords);
        stats.put("avgGazeConfidence", Math.round(avgConfidence * 100) / 100.0);
        stats.put("lookingRatio", Math.round(lookingRatio * 100) / 100.0);
        stats.put("passingByThreshold", PASSING_BY_THRESHOLD);
        stats.put("minGazeSamples", MIN_GAZE_SAMPLES);

        return stats;
    }

    public List<Camera> getCameras() {
        return cameras;
    }

    public void clearVisitorHistory(String visitorId) {
        visitorGazeHistory.remove(visitorId);
    }
}
