package com.oms.controller;

import com.oms.entity.Order;
import com.oms.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @RequestBody Order order) {
        return ResponseEntity.ok(orderService.updateOrder(id, order));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Order> submitForApproval(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.submitForApproval(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Order> approveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.approveOrder(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<Order> refundOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.refundOrder(id));
    }

    @GetMapping
    public ResponseEntity<List<Order>> getCurrentTenantOrders() {
        return ResponseEntity.ok(orderService.getCurrentTenantOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
}
