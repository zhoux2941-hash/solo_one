package com.delivery.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisGeoService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RIDER_LOCATIONS_KEY = "rider:locations";

    public void addRiderLocation(String riderId, Double lng, Double lat) {
        GeoOperations<String, Object> geoOps = redisTemplate.opsForGeo();
        geoOps.add(RIDER_LOCATIONS_KEY, new org.springframework.data.geo.Point(lng, lat), riderId);
    }

    public org.springframework.data.geo.Point getRiderLocation(String riderId) {
        GeoOperations<String, Object> geoOps = redisTemplate.opsForGeo();
        var positions = geoOps.position(RIDER_LOCATIONS_KEY, riderId);
        if (positions != null && !positions.isEmpty() && positions.get(0) != null) {
            return positions.get(0);
        }
        return null;
    }

    public Double getDistanceBetweenRiders(String riderId1, String riderId2) {
        GeoOperations<String, Object> geoOps = redisTemplate.opsForGeo();
        var distance = geoOps.distance(RIDER_LOCATIONS_KEY, riderId1, riderId2, org.springframework.data.geo.Metrics.KILOMETERS);
        return distance != null ? distance.getValue() : null;
    }

    public Double getDistanceToPoint(String riderId, Double lng, Double lat) {
        var riderPoint = getRiderLocation(riderId);
        if (riderPoint == null) {
            return null;
        }
        return calculateHaversineDistance(
            riderPoint.getX(), riderPoint.getY(),
            lng, lat
        );
    }

    private Double calculateHaversineDistance(Double lng1, Double lat1, Double lng2, Double lat2) {
        final int R = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
