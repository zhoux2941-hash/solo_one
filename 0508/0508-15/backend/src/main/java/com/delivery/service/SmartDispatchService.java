package com.delivery.service;

import com.delivery.dto.DispatchRecommendationDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartDispatchService {

    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;
    private final DistanceService distanceService;
    private final RedisGeoService redisGeoService;

    @Value("${dispatch.weight.distance:0.45}")
    private double distanceWeight;

    @Value("${dispatch.weight.load:0.30}")
    private double loadWeight;

    @Value("${dispatch.weight.onTime:0.25}")
    private double onTimeWeight;

    @Value("${dispatch.max-recommendations:3}")
    private int maxRecommendations;

    private static final double MAX_DISTANCE_KM = 10.0;
    private static final int MAX_LOAD = 5;

    public List<DispatchRecommendationDTO> getRecommendations(String orderId) {
        Order order = orderRepository.findAll().stream()
                .filter(o -> orderId.equals(o.getOrderId()))
                .findFirst()
                .orElse(null);

        if (order == null) {
            log.warn("Order not found: {}", orderId);
            return Collections.emptyList();
        }

        List<Rider> availableRiders = riderRepository.findByStatus("IDLE");
        if (availableRiders.isEmpty()) {
            availableRiders = riderRepository.findAll();
        }

        List<DispatchRecommendationDTO> recommendations = new ArrayList<>();

        for (Rider rider : availableRiders) {
            DispatchRecommendationDTO rec = calculateScore(rider, order);
            if (rec != null) {
                recommendations.add(rec);
            }
        }

        recommendations.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        return recommendations.stream()
                .limit(maxRecommendations)
                .collect(Collectors.toList());
    }

    private DispatchRecommendationDTO calculateScore(Rider rider, Order order) {
        double distanceKm;
        if (rider.getCurrentLng() != null && rider.getCurrentLat() != null) {
            distanceKm = redisGeoService.getDistanceToPoint(
                    rider.getRiderId(),
                    order.getMerchantLng(),
                    order.getMerchantLat()
            );
            if (distanceKm == null) {
                distanceKm = calculateHaversine(
                        rider.getCurrentLng(), rider.getCurrentLat(),
                        order.getMerchantLng(), order.getMerchantLat()
                );
            }
        } else {
            distanceKm = 2.0 + Math.random() * 3.0;
        }

        int currentOrders = (int) orderRepository.findByStatus("DELIVERING").stream()
                .filter(o -> rider.getRiderId().equals(o.getRiderId()))
                .count();

        double onTimeRate = calculateOnTimeRate(rider);

        double distanceScore = calculateDistanceScore(distanceKm);
        double loadScore = calculateLoadScore(currentOrders);
        double onTimeScore = onTimeRate;

        double totalScore = (distanceScore * distanceWeight)
                          + (loadScore * loadWeight)
                          + (onTimeScore * onTimeWeight);

        String reason = generateReason(distanceKm, currentOrders, onTimeRate, totalScore);

        return DispatchRecommendationDTO.builder()
                .riderId(rider.getRiderId())
                .riderName(rider.getName())
                .score(totalScore)
                .distanceToMerchant(distanceKm)
                .currentOrders(currentOrders)
                .onTimeRate(onTimeRate * 100)
                .distanceScore(distanceScore * 100)
                .loadScore(loadScore * 100)
                .onTimeScore(onTimeScore * 100)
                .recommendationReason(reason)
                .build();
    }

    private double calculateDistanceScore(double distanceKm) {
        if (distanceKm <= 0) return 1.0;
        if (distanceKm >= MAX_DISTANCE_KM) return 0.0;
        return 1.0 - (distanceKm / MAX_DISTANCE_KM);
    }

    private double calculateLoadScore(int currentOrders) {
        if (currentOrders <= 0) return 1.0;
        if (currentOrders >= MAX_LOAD) return 0.0;
        return 1.0 - ((double) currentOrders / MAX_LOAD);
    }

    private double calculateOnTimeRate(Rider rider) {
        Integer total = rider.getTotalOrders();
        Integer onTime = rider.getOnTimeOrders();

        if (total == null || total == 0) {
            return 0.85;
        }

        if (onTime == null) return 0.0;

        return (double) onTime / total;
    }

    private double calculateHaversine(Double lng1, Double lat1, Double lng2, Double lat2) {
        final int R = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private String generateReason(double distance, int load, double onTimeRate, double score) {
        List<String> reasons = new ArrayList<>();

        if (distance < 2) {
            reasons.add("距离商家很近");
        } else if (distance < 5) {
            reasons.add("距离适中");
        }

        if (load == 0) {
            reasons.add("当前空闲");
        } else if (load <= 2) {
            reasons.add("负载较轻");
        }

        if (onTimeRate >= 0.95) {
            reasons.add("准点率优秀");
        } else if (onTimeRate >= 0.90) {
            reasons.add("准点率良好");
        } else if (onTimeRate >= 0.85) {
            reasons.add("准点率一般");
        }

        if (reasons.isEmpty()) {
            reasons.add("综合评分尚可");
        }

        return String.join("，", reasons);
    }

    public Map<String, List<DispatchRecommendationDTO>> getPendingOrdersWithRecommendations() {
        List<Order> pendingOrders = orderRepository.findByStatus("PENDING");
        Map<String, List<DispatchRecommendationDTO>> result = new LinkedHashMap<>();

        for (Order order : pendingOrders) {
            result.put(order.getOrderId(), getRecommendations(order.getOrderId()));
        }

        return result;
    }
}
