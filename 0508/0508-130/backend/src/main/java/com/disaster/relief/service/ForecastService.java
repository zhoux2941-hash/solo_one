package com.disaster.relief.service;

import com.disaster.relief.dto.ForecastRequest;
import com.disaster.relief.dto.ForecastResponse;
import com.disaster.relief.entity.SupplyForecast;
import com.disaster.relief.repository.SupplyForecastRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForecastService {

    private final SupplyForecastRepository supplyForecastRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "forecast:";

    private static final Map<String, Map<String, Double>> DISASTER_FACTORS = new HashMap<>() {{
        put("FLOOD", new HashMap<>() {{
            put("tent", 0.35);
            put("water", 1.5);
            put("food", 1.2);
            put("medical", 0.8);
        }});
        put("EARTHQUAKE", new HashMap<>() {{
            put("tent", 0.5);
            put("water", 1.8);
            put("food", 1.5);
            put("medical", 1.2);
        }});
        put("FIRE", new HashMap<>() {{
            put("tent", 0.4);
            put("water", 2.0);
            put("food", 1.0);
            put("medical", 0.9);
        }});
        put("LANDSLIDE", new HashMap<>() {{
            put("tent", 0.45);
            put("water", 1.6);
            put("food", 1.3);
            put("medical", 1.0);
        }});
    }};

    public ForecastResponse calculateForecast(ForecastRequest request) {
        String cacheKey = CACHE_PREFIX + request.getDisasterType() + ":" + 
                         request.getDisasterIntensity() + ":" + 
                         request.getAffectedPopulation();

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            log.info("Using cached forecast result");
            return (ForecastResponse) cached;
        }

        Map<String, Double> factors = DISASTER_FACTORS.getOrDefault(
            request.getDisasterType().toUpperCase(),
            DISASTER_FACTORS.get("EARTHQUAKE")
        );

        double intensityMultiplier = 1.0 + (request.getDisasterIntensity() - 1) * 0.15;
        int population = request.getAffectedPopulation();

        int tents = (int) Math.ceil(population * factors.get("tent") * intensityMultiplier / 4);
        int water = (int) Math.ceil(population * factors.get("water") * intensityMultiplier * 3);
        int food = (int) Math.ceil(population * factors.get("food") * intensityMultiplier * 3);
        int medicalKits = (int) Math.ceil(population * factors.get("medical") * intensityMultiplier / 10);

        ForecastResponse response = ForecastResponse.builder()
                .tentQuantity(tents)
                .waterQuantity(water)
                .foodQuantity(food)
                .medicalKitQuantity(medicalKits)
                .disasterType(request.getDisasterType())
                .disasterIntensity(request.getDisasterIntensity())
                .affectedPopulation(population)
                .build();

        SupplyForecast entity = new SupplyForecast();
        entity.setDisasterType(request.getDisasterType());
        entity.setDisasterIntensity(request.getDisasterIntensity());
        entity.setAffectedPopulation(population);
        entity.setTentQuantity(tents);
        entity.setWaterQuantity(water);
        entity.setFoodQuantity(food);
        entity.setMedicalKitQuantity(medicalKits);
        supplyForecastRepository.save(entity);

        redisTemplate.opsForValue().set(cacheKey, response, 10, TimeUnit.MINUTES);

        return response;
    }

    public java.util.List<SupplyForecast> getHistory(String disasterType) {
        if (disasterType != null && !disasterType.isEmpty()) {
            return supplyForecastRepository.findByDisasterTypeOrderByCreatedAtDesc(disasterType);
        }
        return supplyForecastRepository.findAll();
    }
}
