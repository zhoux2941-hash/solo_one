package com.delivery.service;

import com.delivery.dto.RiderLocationDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskPrecomputeService {

    private final OrderRepository orderRepository;
    private final RiderRepository riderRepository;
    private final DistanceService distanceService;
    private final RiskCacheService riskCacheService;

    @Value("${risk.precompute.enabled:true}")
    private boolean precomputeEnabled;

    private static final int RED_THRESHOLD_MINUTES = 5;
    private static final int YELLOW_THRESHOLD_MINUTES = 15;

    @Scheduled(fixedRateString = "${risk.precompute.interval-ms:30000}")
    public void precomputeRiskLevels() {
        if (!precomputeEnabled) {
            return;
        }

        log.debug("Starting risk precompute task...");
        long startTime = System.currentTimeMillis();

        try {
            List<RiderLocationDTO> riskData = computeRiskData();
            riskCacheService.cacheRiskData(riskData);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Risk precompute completed. Processed {} orders in {}ms", riskData.size(), duration);
        } catch (Exception e) {
            log.error("Risk precompute failed", e);
        }
    }

    private List<RiderLocationDTO> computeRiskData() {
        List<RiderLocationDTO> result = new ArrayList<>();
        List<Order> activeOrders = orderRepository.findActiveOrders();

        for (Order order : activeOrders) {
            Rider rider = riderRepository.findByRiderId(order.getRiderId()).orElse(null);
            if (rider == null) {
                continue;
            }

            RiderLocationDTO dto = new RiderLocationDTO();
            dto.setRiderId(rider.getRiderId());
            dto.setRiderName(rider.getName());
            dto.setOrderId(order.getOrderId());
            dto.setLng(rider.getCurrentLng());
            dto.setLat(rider.getCurrentLat());

            LocalDateTime now = LocalDateTime.now();
            Duration remaining = Duration.between(now, order.getExpectedDeliveryTime());
            long remainingMinutes = remaining.toMinutes();
            dto.setRemainingMinutes(remainingMinutes > 0 ? remainingMinutes : 0);

            double distanceToMerchant;
            if (rider.getCurrentLng() != null && rider.getCurrentLat() != null) {
                distanceToMerchant = distanceService.calculateRouteDistance(
                    rider.getRiderId(),
                    order.getMerchantLng(),
                    order.getMerchantLat()
                );
            } else {
                distanceToMerchant = 2.0;
            }
            dto.setDistanceToMerchant(distanceToMerchant);

            long estimatedTime = distanceService.calculateEstimatedTime(distanceToMerchant);
            dto.setEstimatedTime(estimatedTime);

            dto.setRiskLevel(calculateRiskLevel(remainingMinutes, estimatedTime));

            result.add(dto);
        }

        return result;
    }

    private String calculateRiskLevel(long remainingMinutes, long estimatedTime) {
        if (remainingMinutes <= 0) {
            return "RED";
        }

        long slack = remainingMinutes - estimatedTime;

        if (slack <= RED_THRESHOLD_MINUTES) {
            return "RED";
        } else if (slack <= YELLOW_THRESHOLD_MINUTES) {
            return "YELLOW";
        } else {
            return "GREEN";
        }
    }

    public void triggerImmediatePrecompute() {
        log.info("Triggering immediate risk precompute");
        List<RiderLocationDTO> riskData = computeRiskData();
        riskCacheService.cacheRiskData(riskData);
    }
}
