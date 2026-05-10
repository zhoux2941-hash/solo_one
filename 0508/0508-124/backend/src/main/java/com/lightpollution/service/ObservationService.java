package com.lightpollution.service;

import com.lightpollution.dto.ObservationRequest;
import com.lightpollution.entity.Location;
import com.lightpollution.entity.Observation;
import com.lightpollution.repository.LocationRepository;
import com.lightpollution.repository.ObservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class ObservationService {

    @Autowired
    private ObservationRepository observationRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String OBSERVATIONS_CACHE_PREFIX = "observations:";
    private static final String AREA_STATS_CACHE_PREFIX = "area_stats:";
    private static final String LOCATIONS_CACHE_PREFIX = "locations:";
    private static final long CACHE_TTL = 5;

    private static final BigDecimal LOCATION_TOLERANCE = new BigDecimal("0.001");

    @Transactional
    public Observation createObservation(Long userId, ObservationRequest request) {
        BigDecimal roundedLat = roundToNearestLocation(request.getLatitude());
        BigDecimal roundedLng = roundToNearestLocation(request.getLongitude());
        String coordHash = generateCoordHash(userId, roundedLat, roundedLng);

        Location location = locationRepository.findByCoordHash(coordHash)
                .orElse(null);

        if (location == null) {
            location = new Location();
            location.setUserId(userId);
            location.setLatitude(roundedLat);
            location.setLongitude(roundedLng);
            location.setCoordHash(coordHash);
            location.setLocationName(request.getLocationName());
            location.setObservationCount(0);
            location.setFirstObservationAt(LocalDateTime.now());
            location.setLatestObservationAt(LocalDateTime.now());
            location = locationRepository.save(location);
        }

        Observation observation = new Observation();
        observation.setUserId(userId);
        observation.setLatitude(request.getLatitude());
        observation.setLongitude(request.getLongitude());
        observation.setMagnitude(request.getMagnitude());
        observation.setLocationName(request.getLocationName());
        observation.setDescription(request.getDescription());
        observation.setWeather(request.getWeather());
        observation.setLocationId(location.getId());

        Observation savedObs = observationRepository.save(observation);

        updateLocationStats(location, savedObs);
        locationRepository.save(location);

        invalidateRelatedCaches(request.getLatitude(), request.getLongitude());
        return savedObs;
    }

    private void updateLocationStats(Location location, Observation newObs) {
        int newCount = location.getObservationCount() + 1;
        location.setObservationCount(newCount);
        location.setLatestMagnitude(newObs.getMagnitude());
        location.setLatestObservationAt(LocalDateTime.now());

        if (location.getFirstObservationAt() == null) {
            location.setFirstObservationAt(LocalDateTime.now());
        }

        if (location.getLocationName() == null && newObs.getLocationName() != null) {
            location.setLocationName(newObs.getLocationName());
        }

        List<Observation> history = observationRepository.findByUserIdAndLocationAfterDate(
                location.getUserId(),
                location.getLatitude(),
                location.getLongitude(),
                location.getFirstObservationAt()
        );

        if (history.isEmpty()) {
            history = new ArrayList<>();
        }
        history.add(newObs);

        int min = history.stream().mapToInt(Observation::getMagnitude).min().orElse(newObs.getMagnitude());
        int max = history.stream().mapToInt(Observation::getMagnitude).max().orElse(newObs.getMagnitude());
        double avg = history.stream().mapToInt(Observation::getMagnitude).average().orElse(newObs.getMagnitude());

        location.setMinMagnitude(min);
        location.setMaxMagnitude(max);
        location.setAverageMagnitude(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));

        if (history.size() >= 2) {
            double trend = calculateTrend(history);
            location.setMagnitudeTrend(trend);
        } else {
            location.setMagnitudeTrend(0.0);
        }
    }

    private double calculateTrend(List<Observation> observations) {
        if (observations.size() < 2) return 0.0;

        List<Observation> sorted = new ArrayList<>(observations);
        sorted.sort(Comparator.comparing(Observation::getCreatedAt));

        int n = sorted.size();
        double sumDays = 0;
        double sumMagnitude = 0;
        double sumDaysSq = 0;
        double sumCross = 0;

        LocalDateTime first = sorted.get(0).getCreatedAt();

        for (int i = 0; i < n; i++) {
            Observation obs = sorted.get(i);
            double days = ChronoUnit.HOURS.between(first, obs.getCreatedAt()) / 24.0;
            double mag = obs.getMagnitude();

            sumDays += days;
            sumMagnitude += mag;
            sumDaysSq += days * days;
            sumCross += days * mag;
        }

        double denominator = n * sumDaysSq - sumDays * sumDays;
        if (denominator == 0) return 0.0;

        double slope = (n * sumCross - sumDays * sumMagnitude) / denominator;
        return slope;
    }

    public List<Observation> getUserObservations(Long userId) {
        return observationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Map<String, Object>> getObservationsByBoundingBox(BigDecimal minLat, BigDecimal maxLat,
                                                                   BigDecimal minLng, BigDecimal maxLng) {
        String cacheKey = buildLocationsCacheKey(minLat, maxLat, minLng, maxLng);
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return cached;
        }

        List<Location> locations = locationRepository.findByBoundingBox(minLat, maxLat, minLng, maxLng);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Location loc : locations) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", loc.getId());
            map.put("locationId", loc.getId());
            map.put("latitude", loc.getLatitude());
            map.put("longitude", loc.getLongitude());
            map.put("magnitude", loc.getLatestMagnitude());
            map.put("averageMagnitude", loc.getAverageMagnitude());
            map.put("minMagnitude", loc.getMinMagnitude());
            map.put("maxMagnitude", loc.getMaxMagnitude());
            map.put("magnitudeTrend", loc.getMagnitudeTrend());
            map.put("locationName", loc.getLocationName());
            map.put("observationCount", loc.getObservationCount());
            map.put("firstObservationAt", loc.getFirstObservationAt());
            map.put("latestObservationAt", loc.getLatestObservationAt());
            result.add(map);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_TTL, TimeUnit.MINUTES);
        return result;
    }

    public List<Map<String, Object>> getLocationHistory(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("位置不存在"));

        LocalDateTime since = location.getFirstObservationAt() != null 
                ? location.getFirstObservationAt() 
                : LocalDateTime.now().minusMonths(1);

        List<Observation> observations = observationRepository.findByUserIdAndLocationAfterDate(
                location.getUserId(),
                location.getLatitude(),
                location.getLongitude(),
                since
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (Observation obs : observations) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", obs.getId());
            map.put("magnitude", obs.getMagnitude());
            map.put("weather", obs.getWeather());
            map.put("description", obs.getDescription());
            map.put("createdAt", obs.getCreatedAt());
            result.add(map);
        }
        result.sort(Comparator.comparing(m -> (LocalDateTime) m.get("createdAt")));
        
        return result;
    }

    public Map<String, Object> getAreaStats(BigDecimal minLat, BigDecimal maxLat,
                                             BigDecimal minLng, BigDecimal maxLng) {
        String cacheKey = buildAreaStatsCacheKey(minLat, maxLat, minLng, maxLng);
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return cached;
        }

        List<Location> locations = locationRepository.findByBoundingBox(minLat, maxLat, minLng, maxLng);
        
        Double avgMagnitude = null;
        long totalObservations = 0;
        
        if (!locations.isEmpty()) {
            avgMagnitude = locations.stream()
                    .filter(l -> l.getAverageMagnitude() != null)
                    .mapToDouble(l -> l.getAverageMagnitude().doubleValue())
                    .average()
                    .orElse(0);
            totalObservations = locations.stream()
                    .mapToLong(l -> l.getObservationCount() != null ? l.getObservationCount() : 0)
                    .sum();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("averageMagnitude", avgMagnitude != null ? 
            BigDecimal.valueOf(avgMagnitude).setScale(2, RoundingMode.HALF_UP).doubleValue() : null);
        stats.put("locationCount", (long) locations.size());
        stats.put("totalObservations", totalObservations);

        redisTemplate.opsForValue().set(cacheKey, stats, CACHE_TTL, TimeUnit.MINUTES);
        return stats;
    }

    public List<Observation> getAllObservations() {
        return observationRepository.findAllByOrderByCreatedAtDesc();
    }

    private BigDecimal roundToNearestLocation(BigDecimal value) {
        BigDecimal step = LOCATION_TOLERANCE;
        BigDecimal divided = value.divide(step, 0, RoundingMode.HALF_UP);
        return divided.multiply(step).setScale(6, RoundingMode.HALF_UP);
    }

    private String generateCoordHash(Long userId, BigDecimal lat, BigDecimal lng) {
        String input = userId + ":" + lat.toPlainString() + ":" + lng.toPlainString();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return input;
        }
    }

    private String buildObservationsCacheKey(BigDecimal minLat, BigDecimal maxLat,
                                              BigDecimal minLng, BigDecimal maxLng) {
        return OBSERVATIONS_CACHE_PREFIX + minLat + ":" + maxLat + ":" + minLng + ":" + maxLng;
    }

    private String buildLocationsCacheKey(BigDecimal minLat, BigDecimal maxLat,
                                            BigDecimal minLng, BigDecimal maxLng) {
        return LOCATIONS_CACHE_PREFIX + minLat + ":" + maxLat + ":" + minLng + ":" + maxLng;
    }

    private String buildAreaStatsCacheKey(BigDecimal minLat, BigDecimal maxLat,
                                           BigDecimal minLng, BigDecimal maxLng) {
        return AREA_STATS_CACHE_PREFIX + minLat + ":" + maxLat + ":" + minLng + ":" + maxLng;
    }

    private void invalidateRelatedCaches(BigDecimal lat, BigDecimal lng) {
        Set<String> keys = new HashSet<>();
        keys.addAll(redisTemplate.keys(OBSERVATIONS_CACHE_PREFIX + "*"));
        keys.addAll(redisTemplate.keys(LOCATIONS_CACHE_PREFIX + "*"));
        keys.addAll(redisTemplate.keys(AREA_STATS_CACHE_PREFIX + "*"));
        keys.addAll(redisTemplate.keys("heatmap:*"));
        
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
