package com.swimming.lanematcher.service;

import com.swimming.lanematcher.config.LaneConfig;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class LaneLoadService {

    private static final Logger logger = LoggerFactory.getLogger(LaneLoadService.class);
    
    private static final String LANE_LOAD_KEY_PREFIX = "lane:";
    private static final String LANE_LOAD_SUFFIX = ":load";
    private static final int MAX_OCCUPANCY_PER_LANE = 5;
    private static final long LOAD_EXPIRE_SECONDS = 3600;

    private final LaneConfig laneConfig;
    private final StringRedisTemplate redisTemplate;
    private final Random random = new Random();

    public LaneLoadService(LaneConfig laneConfig, StringRedisTemplate redisTemplate) {
        this.laneConfig = laneConfig;
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void initializeLaneLoads() {
        for (LaneConfig.LaneSetting lane : laneConfig.getLanes()) {
            String key = getLaneLoadKey(lane.getId());
            try {
                String currentLoad = redisTemplate.opsForValue().get(key);
                if (currentLoad == null) {
                    int initialLoad = random.nextInt(3);
                    redisTemplate.opsForValue().set(key, String.valueOf(initialLoad));
                    redisTemplate.expire(key, LOAD_EXPIRE_SECONDS, TimeUnit.SECONDS);
                    logger.info("Initialized lane {} with simulated load: {}", lane.getId(), initialLoad);
                }
            } catch (Exception e) {
                logger.warn("Failed to initialize lane load for lane {} using fallback", lane.getId(), e);
            }
        }
    }

    @Scheduled(fixedRate = 30000)
    public void simulateOccupancyChanges() {
        for (LaneConfig.LaneSetting lane : laneConfig.getLanes()) {
            String key = getLaneLoadKey(lane.getId());
            try {
                String currentLoadStr = redisTemplate.opsForValue().get(key);
                int currentLoad = currentLoadStr != null ? Integer.parseInt(currentLoadStr) : 0;
                
                if (random.nextBoolean()) {
                    int change = random.nextBoolean() ? 1 : -1;
                    int newLoad = Math.max(0, Math.min(MAX_OCCUPANCY_PER_LANE, currentLoad + change));
                    if (newLoad != currentLoad) {
                        redisTemplate.opsForValue().set(key, String.valueOf(newLoad));
                        redisTemplate.expire(key, LOAD_EXPIRE_SECONDS, TimeUnit.SECONDS);
                        logger.debug("Simulated load change for lane {}: {} -> {}", lane.getId(), currentLoad, newLoad);
                    }
                }
            } catch (Exception e) {
                logger.debug("Failed to simulate occupancy change for lane {}", lane.getId(), e);
            }
        }
    }

    public Map<Integer, Integer> getAllLaneLoads() {
        Map<Integer, Integer> loads = new HashMap<>();
        for (LaneConfig.LaneSetting lane : laneConfig.getLanes()) {
            loads.put(lane.getId(), getLaneLoad(lane.getId()));
        }
        return loads;
    }

    public int getLaneLoad(Integer laneId) {
        String key = getLaneLoadKey(laneId);
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return Integer.parseInt(value);
            }
        } catch (Exception e) {
            logger.debug("Failed to get lane load from Redis for lane: {}, using default", laneId, e);
        }
        return random.nextInt(3);
    }

    public void incrementLaneLoad(Integer laneId) {
        String key = getLaneLoadKey(laneId);
        try {
            String currentLoadStr = redisTemplate.opsForValue().get(key);
            int currentLoad = currentLoadStr != null ? Integer.parseInt(currentLoadStr) : 0;
            
            if (currentLoad < MAX_OCCUPANCY_PER_LANE) {
                redisTemplate.opsForValue().increment(key);
                redisTemplate.expire(key, LOAD_EXPIRE_SECONDS, TimeUnit.SECONDS);
                logger.info("Incremented lane {} load to {}", laneId, currentLoad + 1);
            }
        } catch (Exception e) {
            logger.warn("Failed to increment lane load in Redis for lane: {}", laneId, e);
        }
    }

    public void decrementLaneLoad(Integer laneId) {
        String key = getLaneLoadKey(laneId);
        try {
            String currentLoadStr = redisTemplate.opsForValue().get(key);
            int currentLoad = currentLoadStr != null ? Integer.parseInt(currentLoadStr) : 0;
            
            if (currentLoad > 0) {
                redisTemplate.opsForValue().decrement(key);
                redisTemplate.expire(key, LOAD_EXPIRE_SECONDS, TimeUnit.SECONDS);
                logger.info("Decremented lane {} load to {}", laneId, currentLoad - 1);
            }
        } catch (Exception e) {
            logger.warn("Failed to decrement lane load in Redis for lane: {}", laneId, e);
        }
    }

    public String getCrowdLevel(Integer load) {
        if (load == 0) {
            return "空闲";
        } else if (load <= 2) {
            return "人少";
        } else if (load <= 3) {
            return "适中";
        } else if (load <= 4) {
            return "较拥挤";
        } else {
            return "拥挤";
        }
    }

    public String getCrowdLevelClass(Integer load) {
        if (load == 0) {
            return "empty";
        } else if (load <= 2) {
            return "low";
        } else if (load <= 3) {
            return "medium";
        } else if (load <= 4) {
            return "high";
        } else {
            return "full";
        }
    }

    public double getLoadFactor(Integer load) {
        return (double) load / MAX_OCCUPANCY_PER_LANE;
    }

    public int getMaxOccupancy() {
        return MAX_OCCUPANCY_PER_LANE;
    }

    private String getLaneLoadKey(Integer laneId) {
        return LANE_LOAD_KEY_PREFIX + laneId + LANE_LOAD_SUFFIX;
    }
}