package com.delivery.service;

import com.delivery.dto.RiderLocationDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final OrderRepository orderRepository;
    private final RiderRepository riderRepository;
    private final DistanceService distanceService;

    private static final int RED_THRESHOLD_MINUTES = 5;
    private static final int YELLOW_THRESHOLD_MINUTES = 15;

    public List<RiderLocationDTO> getActiveRidersWithRisk() {
        List<RiderLocationDTO> result = new ArrayList<>();
        List<Order> activeOrders = orderRepository.findActiveOrders();

        for (Order order : activeOrders) {
            Rider rider = riderRepository.findByRiderId(order.getRiderId()).orElse(null);
            if (rider == null || rider.getCurrentLng() == null) {
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

            double distanceToMerchant = distanceService.calculateRouteDistance(
                rider.getRiderId(),
                order.getMerchantLng(),
                order.getMerchantLat()
            );
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
}
