package com.delivery.simulation;

import com.delivery.dto.GpsReportDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import com.delivery.service.GpsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiderSimulationService {

    private final GpsService gpsService;
    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;

    @Value("${rider.simulation.enabled:true}")
    private boolean simulationEnabled;

    private final Map<String, double[]> riderMovement = new HashMap<>();
    private final Random random = new Random();

    @Scheduled(fixedRateString = "${rider.simulation.interval-ms:10000}")
    public void simulateRiderMovement() {
        if (!simulationEnabled) {
            return;
        }

        List<Order> activeOrders = orderRepository.findActiveOrders();

        for (Order order : activeOrders) {
            Rider rider = riderRepository.findByRiderId(order.getRiderId()).orElse(null);
            if (rider == null) continue;

            double currentLng, currentLat;

            if (rider.getCurrentLng() == null) {
                currentLng = order.getMerchantLng() + (random.nextDouble() - 0.5) * 0.05;
                currentLat = order.getMerchantLat() + (random.nextDouble() - 0.5) * 0.05;
            } else {
                double[] movement = riderMovement.computeIfAbsent(rider.getRiderId(), k -> {
                    double lngStep = (order.getUserLng() - order.getMerchantLng()) / 30;
                    double latStep = (order.getUserLat() - order.getMerchantLat()) / 30;
                    return new double[]{lngStep, latStep};
                });

                currentLng = rider.getCurrentLng() + movement[0] + (random.nextDouble() - 0.5) * 0.002;
                currentLat = rider.getCurrentLat() + movement[1] + (random.nextDouble() - 0.5) * 0.002;
            }

            currentLng = normalizeLng(currentLng);
            currentLat = normalizeLat(currentLat);

            GpsReportDTO dto = new GpsReportDTO();
            dto.setRiderId(rider.getRiderId());
            dto.setOrderId(order.getOrderId());
            dto.setLng(currentLng);
            dto.setLat(currentLat);

            gpsService.reportGps(dto);
            log.debug("Simulated GPS report for rider {}: lng={}, lat={}", rider.getRiderId(), currentLng, currentLat);
        }
    }

    private double normalizeLng(double lng) {
        return Math.max(-180, Math.min(180, lng));
    }

    private double normalizeLat(double lat) {
        return Math.max(-90, Math.min(90, lat));
    }
}
