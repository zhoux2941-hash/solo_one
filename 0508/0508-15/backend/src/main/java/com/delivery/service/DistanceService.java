package com.delivery.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DistanceService {

    private final RedisGeoService redisGeoService;

    @Value("${distance.api.mock:true}")
    private boolean useMock;

    private static final double AVG_SPEED_KM_PER_MIN = 0.4;

    public double calculateRouteDistance(String riderId, Double targetLng, Double targetLat) {
        Double distance = redisGeoService.getDistanceToPoint(riderId, targetLng, targetLat);
        if (distance == null) {
            return 2.0;
        }
        return distance;
    }

    public long calculateEstimatedTime(double distanceKm) {
        return (long) Math.ceil(distanceKm / AVG_SPEED_KM_PER_MIN);
    }
}
