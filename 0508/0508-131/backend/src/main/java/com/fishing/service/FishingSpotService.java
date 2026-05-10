package com.fishing.service;

import com.fishing.entity.FishingSpot;
import com.fishing.repository.FishingSpotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FishingSpotService {

    private final FishingSpotRepository fishingSpotRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final String NEARBY_SPOTS_CACHE = "spot:nearby:";

    @Transactional
    public FishingSpot createSpot(FishingSpot spot) {
        return fishingSpotRepository.save(spot);
    }

    public List<FishingSpot> getSpotsByUser(Long userId) {
        return fishingSpotRepository.findByUserId(userId);
    }

    public List<FishingSpot> getNearbySpots(BigDecimal latitude, BigDecimal longitude, double radiusKm) {
        String cacheKey = NEARBY_SPOTS_CACHE + latitude + ":" + longitude + ":" + radiusKm;
        List<FishingSpot> cached = (List<FishingSpot>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<FishingSpot> allSpots = fishingSpotRepository.findAll();
        List<FishingSpot> nearbySpots = allSpots.stream()
                .map(spot -> {
                    double distance = calculateDistance(
                            latitude.doubleValue(),
                            longitude.doubleValue(),
                            spot.getLatitude().doubleValue(),
                            spot.getLongitude().doubleValue()
                    );
                    spot.setDistance(distance);
                    return spot;
                })
                .filter(spot -> spot.getDistance() <= radiusKm)
                .sorted((s1, s2) -> Double.compare(s1.getDistance(), s2.getDistance()))
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(cacheKey, nearbySpots, 5, java.util.concurrent.TimeUnit.MINUTES);
        return nearbySpots;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }
}
