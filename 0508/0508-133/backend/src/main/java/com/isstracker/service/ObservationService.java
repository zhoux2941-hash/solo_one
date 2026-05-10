package com.isstracker.service;

import com.isstracker.dto.ObservationRequest;
import com.isstracker.entity.ObservationRecord;
import com.isstracker.repository.ObservationRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class ObservationService {
    
    private static final Logger logger = LoggerFactory.getLogger(ObservationService.class);
    
    private static final String OBSERVER_COUNT_PREFIX = "iss:observer:";
    private static final long CACHE_TTL_HOURS = 24;
    
    @Autowired
    private ObservationRecordRepository observationRecordRepository;
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    @Transactional
    public ObservationRecord recordObservation(ObservationRequest request) {
        logger.info("Recording observation for passEventId: {}, lat={}, lon={}", 
                request.getPassEventId(), request.getLatitude(), request.getLongitude());
        
        ObservationRecord record = new ObservationRecord();
        record.setPassEventId(request.getPassEventId());
        record.setLatitude(request.getLatitude());
        record.setLongitude(request.getLongitude());
        record.setDescription(request.getDescription());
        
        ObservationRecord savedRecord = observationRecordRepository.save(record);
        
        incrementObserverCount(request.getPassEventId());
        
        logger.info("Observation recorded with id: {}", savedRecord.getId());
        return savedRecord;
    }
    
    public void incrementObserverCount(String passEventId) {
        String key = OBSERVER_COUNT_PREFIX + passEventId;
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count != null && count == 1) {
            redisTemplate.expire(key, CACHE_TTL_HOURS, TimeUnit.HOURS);
        }
        
        logger.debug("Observer count incremented for {}: {}", passEventId, count);
    }
    
    public Integer getObserverCount(String passEventId) {
        String key = OBSERVER_COUNT_PREFIX + passEventId;
        String value = redisTemplate.opsForValue().get(key);
        
        if (value != null) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                logger.warn("Invalid count value in Redis for key: {}", key);
            }
        }
        
        Long dbCount = observationRecordRepository.countByPassEventId(passEventId);
        int count = dbCount != null ? dbCount.intValue() : 0;
        
        if (count > 0) {
            redisTemplate.opsForValue().set(key, String.valueOf(count), CACHE_TTL_HOURS, TimeUnit.HOURS);
        }
        
        return count;
    }
    
    public Map<String, Integer> getObserverCounts(List<String> passEventIds) {
        Map<String, Integer> counts = new HashMap<>();
        
        List<String> cachedIds = new ArrayList<>();
        for (String id : passEventIds) {
            String key = OBSERVER_COUNT_PREFIX + id;
            String value = redisTemplate.opsForValue().get(key);
            
            if (value != null) {
                try {
                    counts.put(id, Integer.parseInt(value));
                } catch (NumberFormatException e) {
                    cachedIds.add(id);
                }
            } else {
                cachedIds.add(id);
            }
        }
        
        for (String id : cachedIds) {
            Long dbCount = observationRecordRepository.countByPassEventId(id);
            int count = dbCount != null ? dbCount.intValue() : 0;
            counts.put(id, count);
            
            if (count > 0) {
                String key = OBSERVER_COUNT_PREFIX + id;
                redisTemplate.opsForValue().set(key, String.valueOf(count), CACHE_TTL_HOURS, TimeUnit.HOURS);
            }
        }
        
        return counts;
    }
    
    public List<ObservationRecord> getObservationsByPassEvent(String passEventId) {
        return observationRecordRepository.findByPassEventId(passEventId);
    }
    
    public List<ObservationRecord> getAllObservations() {
        return observationRecordRepository.findAll();
    }
}
