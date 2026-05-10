package com.company.watermonitor.controller;

import com.company.watermonitor.dto.DeliveryOrderDTO;
import com.company.watermonitor.entity.DeliveryOrder;
import com.company.watermonitor.service.DeliveryOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final DeliveryOrderService orderService;

    @GetMapping
    public ResponseEntity<List<DeliveryOrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getOrdersWithDetails());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<DeliveryOrder>> getPendingOrders() {
        return ResponseEntity.ok(orderService.getPendingOrders());
    }

    @PostMapping("/{orderId}/deliver")
    public ResponseEntity<DeliveryOrder> deliverOrder(@PathVariable Long orderId) {
        DeliveryOrder order = orderService.deliverOrder(orderId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping("/response-time/histogram")
    public ResponseEntity<Map<String, Long>> getResponseTimeHistogram() {
        return ResponseEntity.ok(orderService.getResponseTimeHistogram());
    }
}
