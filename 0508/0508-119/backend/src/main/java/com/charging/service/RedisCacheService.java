package com.charging.service;

import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {
    
    private static final String PILE_KEY_PREFIX = "charging:pile:";
    private static final String PILE_STATUS_PREFIX = "charging:status:";
    private static final String ALL_PILES_KEY = "charging:piles:all";
    private static final long DEFAULT_EXPIRE = 30;
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    
    public void cachePile(ChargingPile pile) {
        String key = PILE_KEY_PREFIX + pile.getId();
        redisTemplate.opsForValue().set(key, pile, DEFAULT_EXPIRE, TimeUnit.MINUTES);
        updatePileStatusInCache(pile);
    }
    
    public ChargingPile getPileFromCache(Long pileId) {
        String key = PILE_KEY_PREFIX + pileId;
        Object obj = redisTemplate.opsForValue().get(key);
        if (obj != null) {
            return objectMapper.convertValue(obj, ChargingPile.class);
        }
        return null;
    }
    
    public void removePileFromCache(Long pileId) {
        String key = PILE_KEY_PREFIX + pileId;
        redisTemplate.delete(key);
        redisTemplate.delete(ALL_PILES_KEY);
    }
    
    public void updatePileStatusInCache(ChargingPile pile) {
        String statusKey = PILE_STATUS_PREFIX + pile.getId();
        redisTemplate.opsForValue().set(statusKey, pile.getStatus().name(), DEFAULT_EXPIRE, TimeUnit.MINUTES);
    }
    
    public PileStatus getPileStatusFromCache(Long pileId) {
        String statusKey = PILE_STATUS_PREFIX + pileId;
        Object status = redisTemplate.opsForValue().get(statusKey);
        if (status != null) {
            return PileStatus.valueOf(status.toString());
        }
        return null;
    }
    
    public void cacheAllPiles(List<ChargingPile> piles) {
        redisTemplate.opsForValue().set(ALL_PILES_KEY, piles, 5, TimeUnit.MINUTES);
        for (ChargingPile pile : piles) {
            cachePile(pile);
        }
    }
    
    @SuppressWarnings("unchecked")
    public List<ChargingPile> getAllPilesFromCache() {
        Object obj = redisTemplate.opsForValue().get(ALL_PILES_KEY);
        if (obj != null) {
            try {
                return objectMapper.convertValue(obj, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ChargingPile.class));
            } catch (Exception e) {
                log.error("Failed to convert piles from cache", e);
            }
        }
        return null;
    }
    
    public void clearAllPileCache() {
        Set<String> keys = redisTemplate.keys("charging:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
    
    public void setValue(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }
    
    public Object getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }
    
    public void deleteKey(String key) {
        redisTemplate.delete(key);
    }
    
    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
