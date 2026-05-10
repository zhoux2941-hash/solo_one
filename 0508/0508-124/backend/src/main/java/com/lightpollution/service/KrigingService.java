package com.lightpollution.service;

import com.lightpollution.entity.Location;
import com.lightpollution.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class KrigingService {

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.heatmap.grid-size:100}")
    private int gridSize;

    @Value("${app.heatmap.variogram-range:0.5}")
    private double variogramRange;

    @Value("${app.heatmap.nugget:0.1}")
    private double nugget;

    @Value("${app.heatmap.sill:1.0}")
    private double sill;

    @Value("${app.heatmap.cache-ttl:300000}")
    private long cacheTtl;

    private static final String HEATMAP_CACHE_PREFIX = "heatmap:";
    private static final String CONTOUR_CACHE_PREFIX = "contour:";

    public Map<String, Object> generateHeatmap(BigDecimal minLat, BigDecimal maxLat,
                                                BigDecimal minLng, BigDecimal maxLng) {
        String cacheKey = HEATMAP_CACHE_PREFIX + minLat + ":" + maxLat + ":" + minLng + ":" + maxLng;
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return cached;
        }

        List<Location> locations = locationRepository.findByBoundingBox(minLat, maxLat, minLng, maxLng);
        
        if (locations.isEmpty()) {
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("gridData", new double[gridSize][gridSize]);
            emptyResult.put("gridSize", gridSize);
            emptyResult.put("minLat", minLat);
            emptyResult.put("maxLat", maxLat);
            emptyResult.put("minLng", minLng);
            emptyResult.put("maxLng", maxLng);
            emptyResult.put("locationCount", 0);
            return emptyResult;
        }

        double[][] gridData = performSimpleKriging(
            locations,
            minLat.doubleValue(), maxLat.doubleValue(),
            minLng.doubleValue(), maxLng.doubleValue()
        );

        int totalObservations = locations.stream()
                .mapToInt(l -> l.getObservationCount() != null ? l.getObservationCount() : 0)
                .sum();

        Map<String, Object> result = new HashMap<>();
        result.put("gridData", gridData);
        result.put("gridSize", gridSize);
        result.put("minLat", minLat);
        result.put("maxLat", maxLat);
        result.put("minLng", minLng);
        result.put("maxLng", maxLng);
        result.put("locationCount", locations.size());
        result.put("totalObservations", totalObservations);

        redisTemplate.opsForValue().set(cacheKey, result, cacheTtl, TimeUnit.MILLISECONDS);
        return result;
    }

    public Map<String, Object> generateContourMap(BigDecimal minLat, BigDecimal maxLat,
                                                   BigDecimal minLng, BigDecimal maxLng) {
        String cacheKey = CONTOUR_CACHE_PREFIX + minLat + ":" + maxLat + ":" + minLng + ":" + maxLng;
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return cached;
        }

        Map<String, Object> heatmapData = generateHeatmap(minLat, maxLat, minLng, maxLng);
        double[][] gridData = (double[][]) heatmapData.get("gridData");

        List<Double> levels = Arrays.asList(1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0);
        Map<String, Object> contours = generateContourLines(
            gridData,
            minLat.doubleValue(), maxLat.doubleValue(),
            minLng.doubleValue(), maxLng.doubleValue(),
            levels
        );

        Map<String, Object> result = new HashMap<>();
        result.put("contours", contours);
        result.put("levels", levels);
        result.putAll(heatmapData);

        redisTemplate.opsForValue().set(cacheKey, result, cacheTtl, TimeUnit.MILLISECONDS);
        return result;
    }

    private double[][] performSimpleKriging(List<Location> locations,
                                             double minLat, double maxLat,
                                             double minLng, double maxLng) {
        double[][] grid = new double[gridSize][gridSize];
        double latStep = (maxLat - minLat) / (gridSize - 1);
        double lngStep = (maxLng - minLng) / (gridSize - 1);

        int n = locations.size();
        double[] xs = new double[n];
        double[] ys = new double[n];
        double[] values = new double[n];
        double[] weights = new double[n];

        for (int i = 0; i < n; i++) {
            Location loc = locations.get(i);
            xs[i] = loc.getLongitude().doubleValue();
            ys[i] = loc.getLatitude().doubleValue();
            if (loc.getAverageMagnitude() != null) {
                values[i] = loc.getAverageMagnitude().doubleValue();
            } else if (loc.getLatestMagnitude() != null) {
                values[i] = loc.getLatestMagnitude().doubleValue();
            } else {
                values[i] = 3.5;
            }
            int count = loc.getObservationCount() != null ? loc.getObservationCount() : 1;
            weights[i] = Math.sqrt(count);
        }

        double mean = weightedAverage(values, weights);
        double[][] covarianceMatrix = buildWeightedCovarianceMatrix(xs, ys, weights);
        double[] covarianceVector = new double[n];

        for (int i = 0; i < gridSize; i++) {
            for (int j = 0; j < gridSize; j++) {
                double lng = minLng + j * lngStep;
                double lat = minLat + i * latStep;

                for (int k = 0; k < n; k++) {
                    double dist = haversineDistance(lat, lng, ys[k], xs[k]);
                    covarianceVector[k] = calculateCovariance(dist) * weights[k];
                }

                double estimate = solveKrigingEquation(covarianceMatrix, covarianceVector, values, weights, mean);
                grid[i][j] = Math.max(1.0, Math.min(6.0, estimate));
            }
        }

        return grid;
    }

    private double weightedAverage(double[] values, double[] weights) {
        double sumWeighted = 0;
        double sumWeights = 0;
        for (int i = 0; i < values.length; i++) {
            sumWeighted += values[i] * weights[i];
            sumWeights += weights[i];
        }
        return sumWeights > 0 ? sumWeighted / sumWeights : 3.5;
    }

    private double[][] buildWeightedCovarianceMatrix(double[] xs, double[] ys, double[] weights) {
        int n = xs.length;
        double[][] matrix = new double[n][n];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    matrix[i][j] = sill * weights[i];
                } else {
                    double dist = haversineDistance(ys[i], xs[i], ys[j], xs[j]);
                    matrix[i][j] = calculateCovariance(dist) * Math.sqrt(weights[i] * weights[j]);
                }
            }
        }
        return matrix;
    }

    private double calculateCovariance(double distance) {
        if (distance == 0) {
            return sill;
        }
        if (distance >= variogramRange) {
            return 0;
        }
        double h = distance / variogramRange;
        return (sill - nugget) * (1.0 - 1.5 * h + 0.5 * h * h * h);
    }

    private double solveKrigingEquation(double[][] covMatrix, double[] covVector, 
                                         double[] values, double[] weights, double mean) {
        int n = values.length;
        if (n == 0) return mean;

        double[] centeredValues = new double[n];
        for (int i = 0; i < n; i++) {
            centeredValues[i] = values[i] - mean;
        }

        double[] krigingWeights = new double[n];
        double totalCov = 0;
        for (double c : covVector) {
            totalCov += c;
        }

        if (totalCov == 0) {
            return mean;
        }

        for (int i = 0; i < n; i++) {
            krigingWeights[i] = covVector[i] / totalCov;
        }

        double estimate = 0;
        for (int i = 0; i < n; i++) {
            estimate += krigingWeights[i] * centeredValues[i];
        }

        return mean + estimate;
    }

    private Map<String, Object> generateContourLines(double[][] gridData,
                                                      double minLat, double maxLat,
                                                      double minLng, double maxLng,
                                                      List<Double> levels) {
        int rows = gridData.length;
        int cols = gridData[0].length;
        double latStep = (maxLat - minLat) / (rows - 1);
        double lngStep = (maxLng - minLng) / (cols - 1);

        Map<String, Object> contourData = new HashMap<>();
        
        for (double level : levels) {
            List<List<Map<String, Double>>> lines = new ArrayList<>();
            
            for (int i = 0; i < rows - 1; i++) {
                for (int j = 0; j < cols - 1; j++) {
                    List<Map<String, Double>> linePoints = marchSquare(
                        gridData, i, j, level,
                        minLat, minLng, latStep, lngStep
                    );
                    if (linePoints != null && !linePoints.isEmpty()) {
                        lines.add(linePoints);
                    }
                }
            }
            
            contourData.put(String.valueOf(level), lines);
        }

        return contourData;
    }

    private List<Map<String, Double>> marchSquare(double[][] grid, int i, int j, double level,
                                                   double minLat, double minLng,
                                                   double latStep, double lngStep) {
        double v00 = grid[i][j];
        double v10 = grid[i + 1][j];
        double v01 = grid[i][j + 1];
        double v11 = grid[i + 1][j + 1];

        int code = 0;
        if (v00 >= level) code |= 8;
        if (v10 >= level) code |= 4;
        if (v11 >= level) code |= 2;
        if (v01 >= level) code |= 1;

        if (code == 0 || code == 15) return null;

        double lat0 = minLat + i * latStep;
        double lat1 = minLat + (i + 1) * latStep;
        double lng0 = minLng + j * lngStep;
        double lng1 = minLng + (j + 1) * lngStep;

        List<Map<String, Double>> points = new ArrayList<>();

        if ((code & 8) != (code & 4)) {
            points.add(createPoint(lat0, lng0, lat1, lng0, v00, v10, level));
        }
        if ((code & 4) != (code & 2)) {
            points.add(createPoint(lat1, lng0, lat1, lng1, v10, v11, level));
        }
        if ((code & 2) != (code & 1)) {
            points.add(createPoint(lat1, lng1, lat0, lng1, v11, v01, level));
        }
        if ((code & 1) != (code & 8)) {
            points.add(createPoint(lat0, lng1, lat0, lng0, v01, v00, level));
        }

        return points;
    }

    private Map<String, Double> createPoint(double lat1, double lng1, double lat2, double lng2,
                                             double v1, double v2, double level) {
        double t = (level - v1) / (v2 - v1);
        Map<String, Double> point = new HashMap<>();
        point.put("lat", lat1 + t * (lat2 - lat1));
        point.put("lng", lng1 + t * (lng2 - lng1));
        return point;
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
