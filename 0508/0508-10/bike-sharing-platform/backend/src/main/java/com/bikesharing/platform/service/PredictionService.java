package com.bikesharing.platform.service;

import com.bikesharing.platform.dto.PredictionDTO;
import com.bikesharing.platform.entity.BikeRecord;
import com.bikesharing.platform.entity.ParkingPoint;
import com.bikesharing.platform.repository.BikeRecordRepository;
import com.bikesharing.platform.repository.ParkingPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import smile.regression.OLS;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionService {

    private final BikeRecordRepository bikeRecordRepository;
    private final ParkingPointRepository parkingPointRepository;
    private final RedisService redisService;
    private final PredictionCacheService predictionCacheService;

    private static final String PREDICTION_LIST_KEY = "prediction:list";

    public List<PredictionDTO> getNext2HoursPredictions() {
        long queryStart = System.currentTimeMillis();
        log.debug("Getting predictions...");
        
        List<PredictionDTO> cached = predictionCacheService.getLocalCache();
        if (cached != null && !cached.isEmpty()) {
            log.debug("Returning from Caffeine local cache in {}ms", System.currentTimeMillis() - queryStart);
            return cached;
        }
        
        cached = getFromRedis();
        if (cached != null && !cached.isEmpty()) {
            log.debug("Returning from Redis Hash cache in {}ms", System.currentTimeMillis() - queryStart);
            predictionCacheService.putLocalCache(cached);
            return cached;
        }
        
        log.warn("Cache miss, computing predictions synchronously (this may take time)...");
        List<PredictionDTO> predictions = calculatePredictions();
        saveToCache(predictions);
        log.info("Prediction request served from DB in {}ms", System.currentTimeMillis() - queryStart);
        return predictions;
    }

    private List<PredictionDTO> getFromRedis() {
        try {
            Map<Object, Object> hashData = redisService.hashGetAll(RedisService.PREDICTION_HASH_KEY);
            if (hashData.isEmpty()) {
                return null;
            }
            
            List<PredictionDTO> result = new ArrayList<>();
            for (Object key : hashData.keySet()) {
                Object value = hashData.get(key);
                if (value instanceof List) {
                    List<?> list = (List<?>) value;
                    for (Object item : list) {
                        if (item instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> map = (Map<String, Object>) item;
                            result.add(mapToPredictionDTO(map));
                        }
                    }
                }
            }
            
            return result.isEmpty() ? null : result;
        } catch (Exception e) {
            log.warn("Failed to get predictions from Redis: {}", e.getMessage());
            return null;
        }
    }

    private PredictionDTO mapToPredictionDTO(Map<String, Object> map) {
        return PredictionDTO.builder()
            .pointId(((Number) map.get("pointId")).longValue())
            .pointName((String) map.get("pointName"))
            .predictedBorrowDemand(((Number) map.get("predictedBorrowDemand")).intValue())
            .predictedReturnDemand(((Number) map.get("predictedReturnDemand")).intValue())
            .confidence(((Number) map.get("confidence")).doubleValue())
            .build();
    }

    private void saveToCache(List<PredictionDTO> predictions) {
        predictionCacheService.putLocalCache(predictions);
        saveToRedis(predictions);
    }

    private void saveToRedis(List<PredictionDTO> predictions) {
        try {
            Map<Long, List<PredictionDTO>> byPoint = new HashMap<>();
            for (PredictionDTO pred : predictions) {
                byPoint.computeIfAbsent(pred.getPointId(), k -> new ArrayList<>()).add(pred);
            }
            
            Map<String, Object> hashMap = new HashMap<>();
            for (Map.Entry<Long, List<PredictionDTO>> entry : byPoint.entrySet()) {
                String field = "point:" + entry.getKey();
                hashMap.put(field, entry.getValue());
            }
            
            redisService.setHashWithTTL(RedisService.PREDICTION_HASH_KEY, hashMap, 30, TimeUnit.MINUTES);
            redisService.setObjectWithTTL(PREDICTION_LIST_KEY, predictions, 30, TimeUnit.MINUTES);
            
            log.info("Saved {} predictions to Redis Hash (ttl: 30min)", predictions.size());
        } catch (Exception e) {
            log.error("Failed to save predictions to Redis: {}", e.getMessage(), e);
        }
    }

    public List<PredictionDTO> calculatePredictions() {
        log.info("Calculating predictions from MySQL...");
        long startTime = System.currentTimeMillis();
        
        List<PredictionDTO> allPredictions = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        int currentHour = now.getHour();
        
        List<ParkingPoint> points = parkingPointRepository.findAll();
        LocalDateTime endTime = now;
        LocalDateTime startTime = now.minusWeeks(2);
        
        List<BikeRecord> allRecords = bikeRecordRepository.findByTimeBetween(startTime, endTime);
        log.debug("Loaded {} records from MySQL in {}ms", 
                  allRecords.size(), System.currentTimeMillis() - startTime);
        
        Map<Long, List<BikeRecord>> recordsByPoint = new HashMap<>();
        for (BikeRecord record : allRecords) {
            recordsByPoint.computeIfAbsent(record.getPointId(), k -> new ArrayList<>()).add(record);
        }
        
        for (ParkingPoint point : points) {
            List<BikeRecord> pointRecords = recordsByPoint.getOrDefault(point.getPointId(), new ArrayList<>());
            
            Map<Integer, Integer> historicalBorrow = new HashMap<>();
            Map<Integer, Integer> historicalReturn = new HashMap<>();
            
            for (int i = 0; i < 24; i++) {
                historicalBorrow.put(i, 0);
                historicalReturn.put(i, 0);
            }
            
            Map<LocalDateTime, int[]> dailyHourly = new HashMap<>();
            for (BikeRecord record : pointRecords) {
                int hour = record.getTime().getHour();
                LocalDateTime dayStart = record.getTime().toLocalDate().atStartOfDay();
                
                dailyHourly.computeIfAbsent(dayStart, k -> new int[48]);
                
                if (record.getType() == BikeRecord.RecordType.BORROW) {
                    dailyHourly.get(dayStart)[hour * 2]++;
                } else {
                    dailyHourly.get(dayStart)[hour * 2 + 1]++;
                }
            }
            
            for (int[] dayData : dailyHourly.values()) {
                for (int h = 0; h < 24; h++) {
                    historicalBorrow.put(h, historicalBorrow.get(h) + dayData[h * 2]);
                    historicalReturn.put(h, historicalReturn.get(h) + dayData[h * 2 + 1]);
                }
            }
            
            int numDays = Math.max(dailyHourly.size(), 1);
            
            for (int hourOffset = 1; hourOffset <= 2; hourOffset++) {
                int targetHour = (currentHour + hourOffset) % 24;
                LocalDateTime predictionTime = now.plusHours(hourOffset);
                
                double borrowBase = (double) historicalBorrow.getOrDefault(targetHour, 0) / numDays;
                double returnBase = (double) historicalReturn.getOrDefault(targetHour, 0) / numDays;
                
                double[] recentBorrowTrend = extractTrend(pointRecords, BikeRecord.RecordType.BORROW, currentHour);
                double[] recentReturnTrend = extractTrend(pointRecords, BikeRecord.RecordType.RETURN, currentHour);
                
                double borrowOLS = 0;
                double returnOLS = 0;
                double borrowConfidence = 0.5;
                double returnConfidence = 0.5;
                
                if (recentBorrowTrend.length >= 3) {
                    double[][] xBorrow = new double[recentBorrowTrend.length][1];
                    double[] yBorrow = new double[recentBorrowTrend.length];
                    for (int i = 0; i < recentBorrowTrend.length; i++) {
                        xBorrow[i][0] = i;
                        yBorrow[i] = recentBorrowTrend[i];
                    }
                    try {
                        OLS olsBorrow = OLS.fit(xBorrow, yBorrow);
                        borrowOLS = olsBorrow.predict(new double[]{recentBorrowTrend.length});
                        borrowConfidence = Math.min(0.9, 0.5 + olsBorrow.R2() * 0.4);
                    } catch (Exception e) {
                        log.debug("OLS fit failed for borrow: {}", e.getMessage());
                    }
                }
                
                if (recentReturnTrend.length >= 3) {
                    double[][] xReturn = new double[recentReturnTrend.length][1];
                    double[] yReturn = new double[recentReturnTrend.length];
                    for (int i = 0; i < recentReturnTrend.length; i++) {
                        xReturn[i][0] = i;
                        yReturn[i] = recentReturnTrend[i];
                    }
                    try {
                        OLS olsReturn = OLS.fit(xReturn, yReturn);
                        returnOLS = olsReturn.predict(new double[]{recentReturnTrend.length});
                        returnConfidence = Math.min(0.9, 0.5 + olsReturn.R2() * 0.4);
                    } catch (Exception e) {
                        log.debug("OLS fit failed for return: {}", e.getMessage());
                    }
                }
                
                int predictedBorrow = (int) Math.max(0, Math.round(borrowBase * 0.7 + borrowOLS * 0.3));
                int predictedReturn = (int) Math.max(0, Math.round(returnBase * 0.7 + returnOLS * 0.3));
                double avgConfidence = (borrowConfidence + returnConfidence) / 2;
                
                allPredictions.add(PredictionDTO.builder()
                    .pointId(point.getPointId())
                    .pointName(point.getName())
                    .predictionTime(predictionTime)
                    .predictedBorrowDemand(predictedBorrow)
                    .predictedReturnDemand(predictedReturn)
                    .confidence(avgConfidence)
                    .build());
            }
        }
        
        log.info("Prediction calculation completed in {}ms, generated {} predictions",
                  System.currentTimeMillis() - startTime, allPredictions.size());
        
        return allPredictions;
    }

    private double[] extractTrend(List<BikeRecord> records, BikeRecord.RecordType type, int currentHour) {
        Map<LocalDateTime, Integer> hourlyCounts = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (BikeRecord record : records) {
            if (record.getType() != type) continue;
            LocalDateTime hourStart = record.getTime().withMinute(0).withSecond(0).withNano(0);
            hourlyCounts.put(hourStart, hourlyCounts.getOrDefault(hourStart, 0) + 1);
        }
        
        List<Double> values = new ArrayList<>();
        LocalDateTime checkTime = now.minusHours(6).withMinute(0).withSecond(0).withNano(0);
        for (int i = 0; i < 6; i++) {
            values.add((double) hourlyCounts.getOrDefault(checkTime.plusHours(i), 0));
        }
        
        return values.stream().mapToDouble(Double::doubleValue).toArray();
    }

    public void refreshPredictions() {
        log.info("Starting scheduled prediction refresh...");
        long startTime = System.currentTimeMillis();
        
        try {
            List<PredictionDTO> predictions = calculatePredictions();
            saveToCache(predictions);
            log.info("Prediction refresh completed successfully in {}ms, {} predictions",
                      System.currentTimeMillis() - startTime, predictions.size());
        } catch (Exception e) {
            log.error("Prediction refresh failed: {}", e.getMessage(), e);
        }
    }
}
