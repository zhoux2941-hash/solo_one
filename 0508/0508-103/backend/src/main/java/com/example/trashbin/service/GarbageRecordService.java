package com.example.trashbin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trashbin.common.GarbageType;
import com.example.trashbin.dto.GarbageThrowDTO;
import com.example.trashbin.entity.GarbageRecord;
import com.example.trashbin.entity.Resident;
import com.example.trashbin.mapper.GarbageRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class GarbageRecordService extends ServiceImpl<GarbageRecordMapper, GarbageRecord> {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ResidentService residentService;

    private static final String POINTS_KEY_PREFIX = "resident:points:";
    private static final String REQUEST_LOCK_PREFIX = "garbage:lock:";
    private static final String RESULT_CACHE_PREFIX = "garbage:result:";

    private static final String ADD_POINTS_SCRIPT = 
            "local current = redis.call('get', KEYS[1])\n" +
            "if current == false then\n" +
            "    current = 0\n" +
            "end\n" +
            "local newPoints = tonumber(current) + tonumber(ARGV[1])\n" +
            "redis.call('set', KEYS[1], newPoints)\n" +
            "redis.call('expire', KEYS[1], 86400)\n" +
            "return newPoints";

    private static final String TRY_LOCK_SCRIPT =
            "local result = redis.call('set', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])\n" +
            "if result == 'OK' then\n" +
            "    return 1\n" +
            "else\n" +
            "    return 0\n" +
            "end";

    @Transactional(rollbackFor = Exception.class)
    public Integer throwGarbage(GarbageThrowDTO dto) {
        String requestId = dto.getRequestId();
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }

        String lockKey = REQUEST_LOCK_PREFIX + requestId;
        String resultKey = RESULT_CACHE_PREFIX + requestId;

        Integer cachedResult = (Integer) redisTemplate.opsForValue().get(resultKey);
        if (cachedResult != null) {
            return cachedResult;
        }

        DefaultRedisScript<Long> lockScript = new DefaultRedisScript<>();
        lockScript.setScriptText(TRY_LOCK_SCRIPT);
        lockScript.setResultType(Long.class);

        String lockValue = UUID.randomUUID().toString();
        Long lockResult = redisTemplate.execute(
                lockScript,
                Collections.singletonList(lockKey),
                lockValue,
                5000
        );

        if (lockResult == null || lockResult == 0) {
            int retryCount = 0;
            while (retryCount < 5) {
                cachedResult = (Integer) redisTemplate.opsForValue().get(resultKey);
                if (cachedResult != null) {
                    return cachedResult;
                }
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("请求被中断");
                }
                retryCount++;
            }
            throw new RuntimeException("请求处理中，请稍后重试");
        }

        try {
            Resident resident = residentService.getById(dto.getResidentId());
            if (resident == null) {
                throw new RuntimeException("居民不存在");
            }

            int pointsEarned = calculatePoints(dto.getGarbageType(), dto.getWeight());

            String key = POINTS_KEY_PREFIX + dto.getResidentId();
            Integer currentPoints = (Integer) redisTemplate.opsForValue().get(key);
            if (currentPoints == null) {
                currentPoints = resident.getPoints();
            }

            if (pointsEarned > 0) {
                DefaultRedisScript<Long> script = new DefaultRedisScript<>();
                script.setScriptText(ADD_POINTS_SCRIPT);
                script.setResultType(Long.class);

                Long newPoints = redisTemplate.execute(
                        script,
                        Collections.singletonList(key),
                        pointsEarned
                );

                resident.setPoints(newPoints.intValue());
            } else {
                resident.setPoints(currentPoints);
            }

            GarbageRecord record = new GarbageRecord();
            record.setResidentId(dto.getResidentId());
            record.setGarbageType(dto.getGarbageType());
            record.setWeight(dto.getWeight());
            record.setPointsEarned(pointsEarned);
            this.save(record);

            residentService.updateById(resident);

            redisTemplate.opsForValue().set(resultKey, pointsEarned, 60, TimeUnit.SECONDS);

            return pointsEarned;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    private int calculatePoints(String garbageType, BigDecimal weight) {
        try {
            GarbageType type = GarbageType.valueOf(garbageType);
            return (int) (weight.doubleValue() * type.getPointsPerKg());
        } catch (IllegalArgumentException e) {
            return 0;
        }
    }

    public List<GarbageRecord> getByResidentId(Long residentId) {
        LambdaQueryWrapper<GarbageRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GarbageRecord::getResidentId, residentId)
               .orderByDesc(GarbageRecord::getCreateTime);
        return this.list(wrapper);
    }
}
