package com.kindergarten.dashboard.service;

import com.kindergarten.dashboard.config.MaterialThresholdConfig;
import com.kindergarten.dashboard.dto.MaterialWarningDTO;
import com.kindergarten.dashboard.dto.WarningResponseDTO;
import com.kindergarten.dashboard.model.MaterialConsumption;
import com.kindergarten.dashboard.model.MaterialType;
import com.kindergarten.dashboard.repository.MaterialConsumptionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarningService {

    private static final String WARNING_CACHE_KEY = "material:warning:cache";
    private static final long CACHE_TTL_HOURS = 1;

    private final MaterialConsumptionRepository consumptionRepository;
    private final MaterialThresholdConfig thresholdConfig;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Random random = new Random();

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private static final Map<MaterialType, Double> INITIAL_STOCK = Map.of(
            MaterialType.COLOR_PAPER, 150.0,
            MaterialType.GLUE, 40.0,
            MaterialType.GLITTER, 80.0,
            MaterialType.PIPE_CLEANER, 100.0
    );

    public WarningResponseDTO getWarnings() {
        WarningResponseDTO cachedData = getFromCache();
        if (cachedData != null) {
            log.info("Returning warning data from cache");
            cachedData.setFromCache(true);
            return cachedData;
        }

        log.info("Cache miss, calculating new warnings");
        WarningResponseDTO response = calculateWarnings();
        saveToCache(response);

        return response;
    }

    @SuppressWarnings("unchecked")
    private WarningResponseDTO getFromCache() {
        try {
            Object cached = redisTemplate.opsForValue().get(WARNING_CACHE_KEY);
            if (cached == null) {
                return null;
            }
            return objectMapper.convertValue(cached, new TypeReference<WarningResponseDTO>() {});
        } catch (Exception e) {
            log.warn("Failed to read from Redis cache: {}", e.getMessage());
            return null;
        }
    }

    private void saveToCache(WarningResponseDTO response) {
        try {
            redisTemplate.opsForValue().set(WARNING_CACHE_KEY, response, CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.info("Warning data cached for {} hours", CACHE_TTL_HOURS);
        } catch (Exception e) {
            log.warn("Failed to save to Redis cache: {}", e.getMessage());
        }
    }

    private WarningResponseDTO calculateWarnings() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);

        List<MaterialConsumption> consumptions = consumptionRepository
                .findByConsumptionDateBetweenOrderByConsumptionDateAsc(startDate, today);

        Map<MaterialType, List<Double>> dailyConsumptions = new HashMap<>();
        for (MaterialType type : MaterialType.values()) {
            dailyConsumptions.put(type, new ArrayList<>());
        }

        if (consumptions.isEmpty()) {
            log.info("No historical data, using mock consumption rates for warning calculation");
            for (MaterialType type : MaterialType.values()) {
                for (int i = 0; i < 7; i++) {
                    dailyConsumptions.get(type).add(generateMockDailyConsumption(type));
                }
            }
        } else {
            for (MaterialConsumption item : consumptions) {
                dailyConsumptions.get(item.getMaterialType()).add(item.getAmount());
            }
            for (MaterialType type : MaterialType.values()) {
                List<Double> data = dailyConsumptions.get(type);
                while (data.size() < 7) {
                    data.add(generateMockDailyConsumption(type));
                }
            }
        }

        List<MaterialWarningDTO> warnings = new ArrayList<>();

        for (MaterialType type : MaterialType.values()) {
            List<Double> consumptionsForType = dailyConsumptions.get(type);
            double dailyAvg = consumptionsForType.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);

            double initialStock = INITIAL_STOCK.get(type);
            double consumedIn7Days = dailyAvg * 7;
            double currentStock = Math.max(0, initialStock - consumedIn7Days);

            double predicted3Days = currentStock - (dailyAvg * 3);

            double threshold = thresholdConfig.getThreshold(type);

            if (predicted3Days < threshold) {
                int daysToShortage = (int) Math.ceil((currentStock - threshold) / dailyAvg);
                daysToShortage = Math.max(0, daysToShortage);

                LocalDate predictedDate = today.plusDays(daysToShortage);

                String warningLevel;
                if (daysToShortage <= 1) {
                    warningLevel = "CRITICAL";
                } else if (daysToShortage <= 3) {
                    warningLevel = "WARNING";
                } else {
                    warningLevel = "INFO";
                }

                String message = String.format(
                        "预计 %d 天后库存低于阈值（%s %s），当前库存：%.2f %s，日均消耗：%.2f %s",
                        daysToShortage,
                        threshold, type.getUnit(),
                        currentStock, type.getUnit(),
                        dailyAvg, type.getUnit()
                );

                MaterialWarningDTO warning = MaterialWarningDTO.builder()
                        .materialName(type.getDisplayName())
                        .materialType(type.name())
                        .unit(type.getUnit())
                        .currentStock(Math.round(currentStock * 100.0) / 100.0)
                        .dailyAvgConsumption(Math.round(dailyAvg * 100.0) / 100.0)
                        .predictedStockIn3Days(Math.max(0, Math.round(predicted3Days * 100.0) / 100.0))
                        .threshold(threshold)
                        .predictedShortageDate(predictedDate)
                        .warningLevel(warningLevel)
                        .warningMessage(message)
                        .build();

                warnings.add(warning);
            }
        }

        warnings.sort(Comparator.comparing((MaterialWarningDTO w) ->
                switch (w.getWarningLevel()) {
                    case "CRITICAL" -> 0;
                    case "WARNING" -> 1;
                    default -> 2;
                }).thenComparing(MaterialWarningDTO::getPredictedShortageDate));

        return WarningResponseDTO.builder()
                .hasWarning(!warnings.isEmpty())
                .warningCount(warnings.size())
                .generatedAt(LocalDateTime.now())
                .fromCache(false)
                .warnings(warnings)
                .build();
    }

    private double generateMockDailyConsumption(MaterialType type) {
        double amount = switch (type) {
            case COLOR_PAPER -> 20 + random.nextDouble() * 30;
            case GLUE -> 5 + random.nextDouble() * 10;
            case GLITTER -> 3 + random.nextDouble() * 7;
            case PIPE_CLEANER -> 5 + random.nextDouble() * 15;
        };
        return Math.round(amount * 100.0) / 100.0;
    }
}
