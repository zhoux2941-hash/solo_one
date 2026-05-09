package com.bikesharing.platform.service;

import com.bikesharing.platform.dto.HourlyDemandDTO;
import com.bikesharing.platform.repository.BikeRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataAnalysisService {

    private final BikeRecordRepository bikeRecordRepository;
    private final RedisService redisService;

    public List<HourlyDemandDTO> getPastWeekHourlyDemand() {
        List<HourlyDemandDTO> cached = getCachedHourlyDemand();
        if (cached != null) {
            log.debug("Returning cached hourly demand data");
            return cached;
        }
        
        List<HourlyDemandDTO> result = calculateHourlyDemand();
        cacheHourlyDemand(result);
        return result;
    }

    private List<HourlyDemandDTO> calculateHourlyDemand() {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusDays(7);
        
        List<Object[]> rawData = bikeRecordRepository.getHourlyDemand(startTime, endTime);
        
        Map<Integer, Long[]> hourlyMap = new HashMap<>();
        for (int i = 0; i < 24; i++) {
            hourlyMap.put(i, new Long[]{0L, 0L});
        }
        
        for (Object[] row : rawData) {
            Integer hour = ((Number) row[0]).intValue();
            Long borrowCount = ((Number) row[1]).longValue();
            Long returnCount = ((Number) row[2]).longValue();
            hourlyMap.put(hour, new Long[]{borrowCount, returnCount});
        }
        
        List<HourlyDemandDTO> result = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            Long[] counts = hourlyMap.get(i);
            result.add(HourlyDemandDTO.builder()
                .hour(i)
                .borrowCount(counts[0])
                .returnCount(counts[1])
                .build());
        }
        
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<HourlyDemandDTO> getCachedHourlyDemand() {
        try {
            Object cached = redisService.getObject(RedisService.HOURLY_DEMAND_KEY, Object.class);
            if (cached == null) return null;
            if (cached instanceof List) {
                List<Object> list = (List<Object>) cached;
                List<HourlyDemandDTO> result = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map) {
                        Map<String, Object> map = (Map<String, Object>) item;
                        result.add(HourlyDemandDTO.builder()
                            .hour(((Number) map.get("hour")).intValue())
                            .borrowCount(((Number) map.get("borrowCount")).longValue())
                            .returnCount(((Number) map.get("returnCount")).longValue())
                            .build());
                    }
                }
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed to get cached hourly demand: {}", e.getMessage());
        }
        return null;
    }

    private void cacheHourlyDemand(List<HourlyDemandDTO> data) {
        redisService.setObjectWithTTL(RedisService.HOURLY_DEMAND_KEY, data, 1, TimeUnit.HOURS);
    }
}
