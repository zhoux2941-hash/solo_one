package com.company.seatbooking.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
public class SeatStatusCacheService {
    
    private static final String KEY_PREFIX = "seat:status:";
    private static final String MORNING = "MORNING";
    private static final String AFTERNOON = "AFTERNOON";
    private static final String AVAILABLE = "AVAILABLE";
    private static final String BOOKED = "BOOKED";
    
    private final RedisTemplate<String, String> redisTemplate;
    
    public SeatStatusCacheService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    private String getKey(Long seatId, LocalDate date) {
        return KEY_PREFIX + seatId + ":" + date.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
    
    public void setSeatStatus(Long seatId, LocalDate date, String timeSlot, boolean isBooked) {
        String key = getKey(seatId, date);
        String status = isBooked ? BOOKED : AVAILABLE;
        
        if (timeSlot.equals("FULL_DAY")) {
            redisTemplate.opsForHash().put(key, MORNING, status);
            redisTemplate.opsForHash().put(key, AFTERNOON, status);
        } else {
            redisTemplate.opsForHash().put(key, timeSlot, status);
        }
        
        redisTemplate.expire(key, 7, TimeUnit.DAYS);
    }
    
    public String getSeatStatus(Long seatId, LocalDate date, String timeSlot) {
        String key = getKey(seatId, date);
        String status = (String) redisTemplate.opsForHash().get(key, timeSlot);
        return status != null ? status : AVAILABLE;
    }
    
    public String getMorningStatus(Long seatId, LocalDate date) {
        return getSeatStatus(seatId, date, MORNING);
    }
    
    public String getAfternoonStatus(Long seatId, LocalDate date) {
        return getSeatStatus(seatId, date, AFTERNOON);
    }
    
    public boolean isSeatAvailable(Long seatId, LocalDate date, String timeSlot) {
        if (timeSlot.equals("FULL_DAY")) {
            return getMorningStatus(seatId, date).equals(AVAILABLE) &&
                   getAfternoonStatus(seatId, date).equals(AVAILABLE);
        }
        return getSeatStatus(seatId, date, timeSlot).equals(AVAILABLE);
    }
    
    public void clearSeatCache(Long seatId, LocalDate date) {
        String key = getKey(seatId, date);
        redisTemplate.delete(key);
    }
    
    public void markAsBooked(Long seatId, LocalDate date, String timeSlot) {
        setSeatStatus(seatId, date, timeSlot, true);
    }
    
    public void markAsAvailable(Long seatId, LocalDate date, String timeSlot) {
        setSeatStatus(seatId, date, timeSlot, false);
    }
}
