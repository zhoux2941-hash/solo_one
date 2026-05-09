package com.gym.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scripting.support.ResourceScriptSource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RedisCacheService {
    
    private static final String COURSE_CAPACITY_PREFIX = "course:capacity:";
    private static final long EXPIRE_TIME = 24;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private DefaultRedisScript<Long> decreaseCapacityScript;
    private DefaultRedisScript<Long> increaseCapacityScript;
    
    @PostConstruct
    public void init() {
        decreaseCapacityScript = new DefaultRedisScript<>();
        decreaseCapacityScript.setScriptSource(
            new ResourceScriptSource(new ClassPathResource("lua/decrease_capacity.lua"))
        );
        decreaseCapacityScript.setResultType(Long.class);
        
        increaseCapacityScript = new DefaultRedisScript<>();
        increaseCapacityScript.setScriptSource(
            new ResourceScriptSource(new ClassPathResource("lua/increase_capacity.lua"))
        );
        increaseCapacityScript.setResultType(Long.class);
        
        log.info("Redis Lua脚本初始化完成");
    }
    
    public void initCourseCapacity(Long courseId, int capacity) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        redisTemplate.opsForValue().set(key, String.valueOf(capacity), EXPIRE_TIME, TimeUnit.HOURS);
        log.info("初始化课程[{}]容量缓存: {}", courseId, capacity);
    }
    
    public int getRemainingCapacity(Long courseId, int defaultCapacity) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            initCourseCapacity(courseId, defaultCapacity);
            return defaultCapacity;
        }
        return Integer.parseInt(value.toString());
    }
    
    /**
     * 使用Lua脚本原子性检查并扣减名额
     * @param courseId 课程ID
     * @param defaultCapacity 默认容量（缓存不存在时使用）
     * @return 扣减后的剩余名额（>0表示成功，-1表示名额不足，-2表示初始化失败）
     */
    public int decreaseCapacityAtomically(Long courseId, int defaultCapacity) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        
        Long result = redisTemplate.execute(
            decreaseCapacityScript,
            Collections.singletonList(key),
            String.valueOf(defaultCapacity),
            String.valueOf(EXPIRE_TIME)
        );
        
        if (result == null) {
            log.error("Lua脚本执行返回null: courseId={}", courseId);
            return -2;
        }
        
        int intResult = result.intValue();
        
        if (intResult >= 0) {
            log.info("原子扣减成功: courseId={}, 剩余名额={}", courseId, intResult);
        } else if (intResult == -1) {
            log.warn("名额不足: courseId={}", courseId);
        } else if (intResult == -2) {
            log.error("课程缓存初始化失败: courseId={}", courseId);
        }
        
        return intResult;
    }
    
    /**
     * 使用Lua脚本原子性恢复名额（补偿机制）
     * @param courseId 课程ID
     * @param maxCapacity 最大容量上限
     * @return 恢复后的剩余名额（>=0表示成功，-1表示已达上限，-2表示缓存不存在）
     */
    public int increaseCapacityAtomically(Long courseId, int maxCapacity) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        
        Long result = redisTemplate.execute(
            increaseCapacityScript,
            Collections.singletonList(key),
            String.valueOf(maxCapacity)
        );
        
        if (result == null) {
            log.error("Lua脚本执行返回null: courseId={}", courseId);
            return -2;
        }
        
        int intResult = result.intValue();
        
        if (intResult >= 0) {
            log.info("原子恢复成功: courseId={}, 剩余名额={}", courseId, intResult);
        } else if (intResult == -1) {
            log.warn("已达到最大容量，无需恢复: courseId={}, maxCapacity={}", courseId, maxCapacity);
        } else if (intResult == -2) {
            log.warn("课程缓存不存在: courseId={}", courseId);
        }
        
        return intResult;
    }
    
    @Deprecated
    public boolean decreaseCapacity(Long courseId) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        Long remaining = redisTemplate.opsForValue().decrement(key);
        return remaining != null && remaining >= 0;
    }
    
    @Deprecated
    public void increaseCapacity(Long courseId) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        redisTemplate.opsForValue().increment(key);
    }
    
    public void deleteCourseCapacity(Long courseId) {
        String key = COURSE_CAPACITY_PREFIX + courseId;
        redisTemplate.delete(key);
        log.info("删除课程容量缓存: courseId={}", courseId);
    }
}
