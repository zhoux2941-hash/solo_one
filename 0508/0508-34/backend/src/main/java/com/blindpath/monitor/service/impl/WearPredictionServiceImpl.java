package com.blindpath.monitor.service.impl;

import com.blindpath.monitor.dto.WearPredictionDTO;
import com.blindpath.monitor.entity.DetectionPoint;
import com.blindpath.monitor.repository.DetectionPointRepository;
import com.blindpath.monitor.service.WearPredictionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WearPredictionServiceImpl implements WearPredictionService {

    private final DetectionPointRepository detectionPointRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final int HISTORICAL_DAYS = 30;
    private static final int PREDICT_DAYS = 3;
    private static final int SMA_WINDOW = 7;
    private static final String CACHE_KEY = "wear:prediction";
    private static final long CACHE_TTL_HOURS = 1;

    @Override
    public WearPredictionDTO predictWearTrend() {
        String cachedValue = stringRedisTemplate.opsForValue().get(CACHE_KEY);
        if (cachedValue != null) {
            try {
                log.info("命中 Redis 缓存");
                return objectMapper.readValue(cachedValue, WearPredictionDTO.class);
            } catch (JsonProcessingException e) {
                log.warn("缓存解析失败，重新计算: {}", e.getMessage());
            }
        }

        log.info("缓存未命中，执行预测计算");
        WearPredictionDTO result = calculatePrediction();

        try {
            String json = objectMapper.writeValueAsString(result);
            stringRedisTemplate.opsForValue().set(CACHE_KEY, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.info("预测结果已缓存到 Redis，有效期 {} 小时", CACHE_TTL_HOURS);
        } catch (JsonProcessingException e) {
            log.error("缓存序列化失败: {}", e.getMessage());
        }

        return result;
    }

    private WearPredictionDTO calculatePrediction() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(HISTORICAL_DAYS - 1);

        List<DetectionPoint> allData = detectionPointRepository
                .findByRecordDateBetweenOrderByDistanceAscRecordDateAsc(startDate, today);

        Map<Integer, List<Integer>> distanceDataMap = groupDataByDistance(allData);

        List<WearPredictionDTO.PredictionPoint> predictions = new ArrayList<>();

        for (Map.Entry<Integer, List<Integer>> entry : distanceDataMap.entrySet()) {
            Integer distance = entry.getKey();
            List<Integer> wearHistory = entry.getValue();

            List<Double> smaValues = calculateSMA(wearHistory, SMA_WINDOW);

            List<Double> futurePredictions = predictNextDays(smaValues, PREDICT_DAYS);

            Double avgPrediction = futurePredictions.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);

            Double trend = calculateTrend(smaValues);

            predictions.add(WearPredictionDTO.PredictionPoint.builder()
                    .distance(distance)
                    .predictedWear(Math.round(avgPrediction * 100.0) / 100.0)
                    .dailyPredictions(futurePredictions.stream()
                            .map(v -> Math.round(v * 100.0) / 100.0)
                            .collect(Collectors.toList()))
                    .trend(Math.round(trend * 1000.0) / 1000.0)
                    .build());
        }

        predictions.sort(Comparator.comparing(WearPredictionDTO.PredictionPoint::getDistance));

        return WearPredictionDTO.builder()
                .predictions(predictions)
                .predictionDate(today.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .modelUsed("Simple Moving Average (SMA-" + SMA_WINDOW + ")")
                .daysPredicted(PREDICT_DAYS)
                .historicalDaysUsed(HISTORICAL_DAYS)
                .build();
    }

    private Map<Integer, List<Integer>> groupDataByDistance(List<DetectionPoint> data) {
        Map<Integer, List<Integer>> map = new TreeMap<>();
        for (DetectionPoint point : data) {
            map.computeIfAbsent(point.getDistance(), k -> new ArrayList<>())
                    .add(point.getWearDegree());
        }
        return map;
    }

    private List<Double> calculateSMA(List<Integer> data, int window) {
        List<Double> sma = new ArrayList<>();
        if (data == null || data.size() == 0) return sma;

        int n = data.size();
        for (int i = 0; i < n; i++) {
            int start = Math.max(0, i - window + 1);
            int count = i - start + 1;
            double sum = 0;
            for (int j = start; j <= i; j++) {
                sum += data.get(j);
            }
            sma.add(sum / count);
        }
        return sma;
    }

    private List<Double> predictNextDays(List<Double> smaValues, int daysToPredict) {
        List<Double> predictions = new ArrayList<>();
        if (smaValues == null || smaValues.size() < 2) {
            for (int i = 0; i < daysToPredict; i++) {
                predictions.add(0.0);
            }
            return predictions;
        }

        int n = smaValues.size();
        double recentAvg = 0;
        int recentWindow = Math.min(SMA_WINDOW, n);
        for (int i = n - recentWindow; i < n; i++) {
            recentAvg += smaValues.get(i);
        }
        recentAvg /= recentWindow;

        double trend = calculateTrend(smaValues);

        double currentValue = smaValues.get(n - 1);
        for (int i = 1; i <= daysToPredict; i++) {
            double predicted = recentAvg + trend * i;
            predicted = Math.max(0, Math.min(100, predicted));
            predictions.add(predicted);
        }

        return predictions;
    }

    private Double calculateTrend(List<Double> smaValues) {
        if (smaValues == null || smaValues.size() < 2) return 0.0;

        int n = smaValues.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (int i = 0; i < n; i++) {
            double x = i + 1;
            double y = smaValues.get(i);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
}
