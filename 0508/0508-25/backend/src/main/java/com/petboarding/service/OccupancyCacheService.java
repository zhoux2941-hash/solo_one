package com.petboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OccupancyCacheService {
    
    private final StringRedisTemplate redisTemplate;
    
    private static final String OCCUPANCY_KEY_PREFIX = "occupancy:";
    
    private static final String CHECK_AND_SET_OCCUPANCY_SCRIPT =
        "local keys = KEYS\n" +
        "local positions = ARGV\n" +
        "local result = {}\n" +
        "local all_available = true\n" +
        "\n" +
        "for i = 1, #keys do\n" +
        "    local key = keys[i]\n" +
        "    local pos = tonumber(positions[i])\n" +
        "    local is_occupied = redis.call('GETBIT', key, pos)\n" +
        "    \n" +
        "    if is_occupied == 1 then\n" +
        "        all_available = false\n" +
        "        table.insert(result, {key, pos, 0})\n" +
        "    else\n" +
        "        table.insert(result, {key, pos, 1})\n" +
        "    end\n" +
        "end\n" +
        "\n" +
        "if all_available then\n" +
        "    for i = 1, #keys do\n" +
        "        local key = keys[i]\n" +
        "        local pos = tonumber(positions[i])\n" +
        "        redis.call('SETBIT', key, pos, 1)\n" +
        "    end\n" +
        "    return 1\n" +
        "else\n" +
        "    return 0\n" +
        "end";
    
    private static final String CLEAR_OCCUPANCY_SCRIPT =
        "local keys = KEYS\n" +
        "local positions = ARGV\n" +
        "\n" +
        "for i = 1, #keys do\n" +
        "    redis.call('SETBIT', keys[i], tonumber(positions[i]), 0)\n" +
        "end\n" +
        "\n" +
        "return 1";
    
    private final DefaultRedisScript<Long> checkAndSetScript = 
            new DefaultRedisScript<>(CHECK_AND_SET_OCCUPANCY_SCRIPT, Long.class);
    
    private final DefaultRedisScript<Long> clearOccupancyScript = 
            new DefaultRedisScript<>(CLEAR_OCCUPANCY_SCRIPT, Long.class);
    
    public String getOccupancyKey(Long roomId, int year, int month) {
        return OCCUPANCY_KEY_PREFIX + roomId + ":" + year + "-" + String.format("%02d", month);
    }
    
    public void markOccupied(Long roomId, LocalDate date) {
        String key = getOccupancyKey(roomId, date.getYear(), date.getMonthValue());
        int dayOfMonth = date.getDayOfMonth() - 1;
        redisTemplate.opsForValue().setBit(key, dayOfMonth, true);
        log.info("Marked room {} as occupied on {}", roomId, date);
    }
    
    public void markOccupied(Long roomId, LocalDate startDate, LocalDate endDate) {
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            markOccupied(roomId, date);
            date = date.plusDays(1);
        }
    }
    
    public void markAvailable(Long roomId, LocalDate date) {
        String key = getOccupancyKey(roomId, date.getYear(), date.getMonthValue());
        int dayOfMonth = date.getDayOfMonth() - 1;
        redisTemplate.opsForValue().setBit(key, dayOfMonth, false);
        log.info("Marked room {} as available on {}", roomId, date);
    }
    
    public void markAvailable(Long roomId, LocalDate startDate, LocalDate endDate) {
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            markAvailable(roomId, date);
            date = date.plusDays(1);
        }
    }
    
    public boolean isOccupied(Long roomId, LocalDate date) {
        String key = getOccupancyKey(roomId, date.getYear(), date.getMonthValue());
        int dayOfMonth = date.getDayOfMonth() - 1;
        Boolean result = redisTemplate.opsForValue().getBit(key, dayOfMonth);
        return Boolean.TRUE.equals(result);
    }
    
    public List<Boolean> getMonthOccupancy(Long roomId, int year, int month) {
        String key = getOccupancyKey(roomId, year, month);
        YearMonth yearMonth = YearMonth.of(year, month);
        int daysInMonth = yearMonth.lengthOfMonth();
        
        List<Boolean> occupancy = new ArrayList<>(daysInMonth);
        
        byte[] bitmap = redisTemplate.execute((RedisCallback<byte[]>) connection -> 
            connection.get(key.getBytes()));
        
        if (bitmap == null) {
            for (int i = 0; i < daysInMonth; i++) {
                occupancy.add(false);
            }
            return occupancy;
        }
        
        BitSet bitSet = BitSet.valueOf(bitmap);
        for (int i = 0; i < daysInMonth; i++) {
            occupancy.add(bitSet.get(i));
        }
        
        return occupancy;
    }
    
    public List<LocalDate> getOccupiedDates(Long roomId, int year, int month) {
        List<Boolean> occupancy = getMonthOccupancy(roomId, year, month);
        List<LocalDate> occupiedDates = new ArrayList<>();
        YearMonth yearMonth = YearMonth.of(year, month);
        
        for (int i = 0; i < occupancy.size(); i++) {
            if (occupancy.get(i)) {
                occupiedDates.add(yearMonth.atDay(i + 1));
            }
        }
        
        return occupiedDates;
    }
    
    public boolean isAvailable(Long roomId, LocalDate startDate, LocalDate endDate) {
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            if (isOccupied(roomId, date)) {
                return false;
            }
            date = date.plusDays(1);
        }
        return true;
    }
    
    public AtomicReservationResult tryReserveAtomically(Long roomId, LocalDate startDate, LocalDate endDate) {
        List<String> keys = new ArrayList<>();
        List<String> positions = new ArrayList<>();
        List<LocalDate> dates = new ArrayList<>();
        
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            String key = getOccupancyKey(roomId, date.getYear(), date.getMonthValue());
            int dayOfMonth = date.getDayOfMonth() - 1;
            
            keys.add(key);
            positions.add(String.valueOf(dayOfMonth));
            dates.add(date);
            
            date = date.plusDays(1);
        }
        
        if (keys.isEmpty()) {
            return new AtomicReservationResult(false, Collections.emptyList(), "日期范围无效");
        }
        
        log.info("Atomic reservation attempt: roomId={}, dates={}", roomId, dates);
        
        Long result = redisTemplate.execute(
                checkAndSetScript,
                keys,
                positions.toArray(new String[0])
        );
        
        boolean success = Long.valueOf(1).equals(result);
        
        if (success) {
            log.info("Atomic reservation SUCCESS: roomId={}, dates={}", roomId, dates);
            return new AtomicReservationResult(true, dates, null);
        } else {
            log.warn("Atomic reservation FAILED (conflict): roomId={}, dates={}", roomId, dates);
            
            List<LocalDate> conflictingDates = new ArrayList<>();
            for (LocalDate d : dates) {
                if (isOccupied(roomId, d)) {
                    conflictingDates.add(d);
                }
            }
            
            return new AtomicReservationResult(false, conflictingDates, "日期冲突: " + conflictingDates);
        }
    }
    
    public void cancelReservationAtomically(Long roomId, LocalDate startDate, LocalDate endDate) {
        List<String> keys = new ArrayList<>();
        List<String> positions = new ArrayList<>();
        
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            String key = getOccupancyKey(roomId, date.getYear(), date.getMonthValue());
            int dayOfMonth = date.getDayOfMonth() - 1;
            
            keys.add(key);
            positions.add(String.valueOf(dayOfMonth));
            
            date = date.plusDays(1);
        }
        
        if (!keys.isEmpty()) {
            redisTemplate.execute(
                    clearOccupancyScript,
                    keys,
                    positions.toArray(new String[0])
            );
            log.info("Atomic cancellation: roomId={}, startDate={}, endDate={}", roomId, startDate, endDate);
        }
    }
    
    public long countOccupiedDays(Long roomId, int year, int month) {
        return getMonthOccupancy(roomId, year, month).stream()
                .filter(Boolean::booleanValue)
                .count();
    }
    
    public double getOccupancyRate(Long roomId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        int daysInMonth = yearMonth.lengthOfMonth();
        long occupiedDays = countOccupiedDays(roomId, year, month);
        return (double) occupiedDays / daysInMonth;
    }
    
    public void clearRoomCache(Long roomId, int year, int month) {
        String key = getOccupancyKey(roomId, year, month);
        redisTemplate.delete(key);
        log.info("Cleared occupancy cache for room {} in {}-{}", roomId, year, month);
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AtomicReservationResult {
        private final boolean success;
        private final List<LocalDate> affectedDates;
        private final String errorMessage;
    }
}
