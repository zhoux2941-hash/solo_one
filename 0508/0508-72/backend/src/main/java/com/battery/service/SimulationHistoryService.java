package com.battery.service;

import com.alibaba.fastjson.JSON;
import com.battery.dto.SimulationResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SimulationHistoryService {

    private static final String REDIS_KEY = "battery:simulation:history";

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${battery.simulation.max-records:10}")
    private int maxRecords;

    public SimulationHistoryService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void save(SimulationResponse response) {
        try {
            String json = JSON.toJSONString(response);
            redisTemplate.opsForList().leftPush(REDIS_KEY, json);
            redisTemplate.opsForList().trim(REDIS_KEY, 0, maxRecords - 1);
            redisTemplate.expire(REDIS_KEY, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            System.err.println("Redis存储失败: " + e.getMessage());
        }
    }

    public List<SimulationResponse> getRecent() {
        List<SimulationResponse> results = new ArrayList<>();
        try {
            List<String> jsonList = redisTemplate.opsForList().range(REDIS_KEY, 0, -1);
            if (jsonList != null) {
                for (String json : jsonList) {
                    try {
                        SimulationResponse response = JSON.parseObject(json, SimulationResponse.class);
                        if (response != null) {
                            results.add(response);
                        }
                    } catch (Exception e) {
                        System.err.println("JSON解析失败: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败: " + e.getMessage());
        }
        return results;
    }

    public void clear() {
        try {
            redisTemplate.delete(REDIS_KEY);
        } catch (Exception e) {
            System.err.println("Redis清除失败: " + e.getMessage());
        }
    }
}