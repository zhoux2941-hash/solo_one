package com.farm.silo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farm.silo.model.TemperatureData;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class TemperatureService {

    private static final Logger logger = LoggerFactory.getLogger(TemperatureService.class);
    
    private static final int SILO_COUNT = 4;
    private static final int LAYER_COUNT = 5;
    private static final String[] SILO_NAMES = {"A", "B", "C", "D"};
    private static final String[] LAYER_NAMES = {"顶层", "第4层", "第3层", "第2层", "底层"};
    private static final String CACHE_KEY = "silo:temperature:current";
    private static final long CACHE_TTL_SECONDS = 35;
    
    private static final double HIGH_TEMP_THRESHOLD = AlarmService.HIGH_TEMPERATURE_THRESHOLD;
    private static final double HIGH_TEMP_BASE = 29.5;
    private static final double HIGH_TEMP_PROBABILITY = 0.3;
    
    private final Random random = new Random();
    
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final AlarmService alarmService;
    private ValueOperations<String, String> valueOps;
    
    public TemperatureService(RedisTemplate<String, String> redisTemplate, 
                              ObjectMapper objectMapper,
                              AlarmService alarmService) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.alarmService = alarmService;
    }
    
    @PostConstruct
    public void init() {
        this.valueOps = redisTemplate.opsForValue();
        logger.info("TemperatureService 初始化完成，立即生成初始数据...");
        updateTemperatureData();
    }
    
    public TemperatureData getCurrentTemperature() {
        logger.info("获取当前温度数据...");
        
        String cachedJson = valueOps.get(CACHE_KEY);
        
        if (cachedJson != null && !cachedJson.isEmpty()) {
            try {
                logger.info("从Redis缓存读取数据");
                return parseJsonToTemperatureData(cachedJson);
            } catch (Exception e) {
                logger.warn("解析缓存数据失败，重新生成: {}", e.getMessage());
            }
        }
        
        logger.info("缓存中没有数据，生成新数据");
        TemperatureData data = updateTemperatureData();
        return data;
    }
    
    @Scheduled(fixedRate = 30000, initialDelay = 30000)
    public void scheduleTemperatureUpdate() {
        logger.info("========== 定时任务触发 ==========");
        logger.info("执行时间: {}", LocalDateTime.now());
        updateTemperatureData();
        logger.info("==================================");
    }
    
    public TemperatureData updateTemperatureData() {
        LocalDateTime timestamp = LocalDateTime.now();
        TemperatureData data = generateTemperatureDataWithTimestamp(timestamp);
        
        checkAndRecordAlarms(data);
        
        try {
            String json = objectMapper.writeValueAsString(data);
            logger.info("生成新温度数据 (JSON长度: {} 字符)", json.length());
            logger.info("温度矩阵: {}", formatMatrix(data.getTemperatureMatrix()));
            
            valueOps.set(CACHE_KEY, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            logger.info("数据已写入Redis，key: {}, TTL: {}秒", CACHE_KEY, CACHE_TTL_SECONDS);
            
            String storedJson = valueOps.get(CACHE_KEY);
            if (storedJson != null) {
                logger.info("Redis验证: 数据已成功存储");
            } else {
                logger.warn("Redis验证: 数据可能未正确存储");
            }
            
        } catch (Exception e) {
            logger.error("序列化或存储温度数据失败: {}", e.getMessage(), e);
        }
        
        return data;
    }
    
    private void checkAndRecordAlarms(TemperatureData data) {
        List<List<Double>> matrix = data.getTemperatureMatrix();
        int alarmCount = 0;
        
        for (int siloIndex = 0; siloIndex < matrix.size(); siloIndex++) {
            List<Double> siloTemps = matrix.get(siloIndex);
            for (int layerIndex = 0; layerIndex < siloTemps.size(); layerIndex++) {
                double temp = siloTemps.get(layerIndex);
                if (temp > HIGH_TEMP_THRESHOLD) {
                    alarmService.recordAlarm(
                        SILO_NAMES[siloIndex],
                        LAYER_NAMES[layerIndex],
                        siloIndex,
                        layerIndex,
                        temp
                    );
                    alarmCount++;
                }
            }
        }
        
        if (alarmCount > 0) {
            logger.warn("本次检测到 {} 个高温报警", alarmCount);
        }
    }
    
    private TemperatureData parseJsonToTemperatureData(String json) throws Exception {
        return objectMapper.readValue(json, new TypeReference<TemperatureData>() {});
    }
    
    private TemperatureData generateTemperatureDataWithTimestamp(LocalDateTime timestamp) {
        List<List<Double>> matrix = new ArrayList<>();
        
        for (int silo = 0; silo < SILO_COUNT; silo++) {
            List<Double> siloTemps = new ArrayList<>();
            for (int layer = 0; layer < LAYER_COUNT; layer++) {
                double temp = generateTemperature(silo, layer);
                siloTemps.add(temp);
            }
            matrix.add(siloTemps);
        }
        
        return new TemperatureData(timestamp, matrix, SILO_NAMES, LAYER_NAMES);
    }
    
    private double generateTemperature(int siloIndex, int layerIndex) {
        double baseTemp = getBaseTemperature(layerIndex);
        double variation;
        
        if (layerIndex == 0 && random.nextDouble() < HIGH_TEMP_PROBABILITY) {
            double highVariation = random.nextDouble() * 3.0;
            variation = HIGH_TEMP_BASE - baseTemp + highVariation;
        } else {
            variation = (random.nextDouble() - 0.5) * 2.0;
        }
        
        double temp = Math.round((baseTemp + variation) * 10.0) / 10.0;
        return temp;
    }
    
    private double getBaseTemperature(int layer) {
        double[] baseTemps = {28.0, 25.0, 22.0, 19.0, 16.0};
        return baseTemps[layer];
    }
    
    private String formatMatrix(List<List<Double>> matrix) {
        StringBuilder sb = new StringBuilder("\n");
        for (int silo = 0; silo < matrix.size(); silo++) {
            sb.append("  筒仓").append((char)('A' + silo)).append(": ").append(matrix.get(silo)).append("\n");
        }
        return sb.toString();
    }
}
