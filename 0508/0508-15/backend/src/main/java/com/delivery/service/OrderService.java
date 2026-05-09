package com.delivery.service;

import com.delivery.dto.CreateOrderDTO;
import com.delivery.dto.OrderAssignDTO;
import com.delivery.entity.Order;
import com.delivery.entity.Rider;
import com.delivery.repository.OrderRepository;
import com.delivery.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final RiderRepository riderRepository;

    public Order createOrder(CreateOrderDTO dto) {
        Optional<Order> existing = orderRepository.findAll().stream()
                .filter(o -> dto.getOrderId().equals(o.getOrderId()))
                .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        Order order = new Order();
        order.setOrderId(dto.getOrderId());
        order.setMerchantLng(dto.getMerchantLng());
        order.setMerchantLat(dto.getMerchantLat());
        order.setUserLng(dto.getUserLng());
        order.setUserLat(dto.getUserLat());
        order.setCreatedAt(LocalDateTime.now());
        order.setExpectedDeliveryTime(
            LocalDateTime.now().plusMinutes(dto.getExpectedMinutes() != null ? dto.getExpectedMinutes() : 30)
        );
        order.setStatus("PENDING");

        return orderRepository.save(order);
    }

    @Transactional
    public boolean assignOrder(OrderAssignDTO dto) {
        Optional<Order> orderOpt = orderRepository.findAll().stream()
                .filter(o -> dto.getOrderId().equals(o.getOrderId()))
                .findFirst();

        if (orderOpt.isEmpty()) {
            log.warn("Order not found: {}", dto.getOrderId());
            return false;
        }

        Optional<Rider> riderOpt = riderRepository.findByRiderId(dto.getRiderId());
        if (riderOpt.isEmpty()) {
            log.warn("Rider not found: {}", dto.getRiderId());
            return false;
        }

        Order order = orderOpt.get();
        Rider rider = riderOpt.get();

        if (!"PENDING".equals(order.getStatus())) {
            log.warn("Order {} is not pending, current status: {}", order.getOrderId(), order.getStatus());
            return false;
        }

        order.setRiderId(rider.getRiderId());
        order.setStatus("DELIVERING");
        orderRepository.save(order);

        rider.setCurrentOrderId(order.getOrderId());
        rider.setStatus("DELIVERING");
        riderRepository.save(rider);

        log.info("Assigned order {} to rider {}", order.getOrderId(), rider.getName());
        return true;
    }

    public boolean cancelOrder(String orderId) {
        Optional<Order> orderOpt = orderRepository.findAll().stream()
                .filter(o -> orderId.equals(o.getOrderId()))
                .findFirst();

        if (orderOpt.isEmpty()) {
            return false;
        }

        Order order = orderOpt.get();
        if (!"PENDING".equals(order.getStatus())) {
            return false;
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);
        return true;
    }
}
