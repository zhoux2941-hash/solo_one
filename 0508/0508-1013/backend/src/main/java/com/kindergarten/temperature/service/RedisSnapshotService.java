package com.kindergarten.temperature.service;

import com.kindergarten.temperature.dto.TemperatureSnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisSnapshotService {

    private static final String SNAPSHOT_KEY = "temperature:snapshot";
    private static final long EXPIRE_TIME = 24;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void saveSnapshot(TemperatureSnapshot snapshot) {
        String key = SNAPSHOT_KEY + ":" + snapshot.getBedNo();
        redisTemplate.opsForValue().set(key, snapshot, EXPIRE_TIME, TimeUnit.HOURS);
    }

    public TemperatureSnapshot getSnapshot(Integer bedNo) {
        String key = SNAPSHOT_KEY + ":" + bedNo;
        Object obj = redisTemplate.opsForValue().get(key);
        if (obj instanceof TemperatureSnapshot) {
            return (TemperatureSnapshot) obj;
        }
        return null;
    }

    public List<TemperatureSnapshot> getAllSnapshots() {
        List<TemperatureSnapshot> snapshots = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            TemperatureSnapshot snapshot = getSnapshot(i);
            if (snapshot != null) {
                snapshots.add(snapshot);
            }
        }
        return snapshots;
    }

    public void clearAllSnapshots() {
        for (int i = 1; i <= 12; i++) {
            String key = SNAPSHOT_KEY + ":" + i;
            redisTemplate.delete(key);
        }
    }
}
