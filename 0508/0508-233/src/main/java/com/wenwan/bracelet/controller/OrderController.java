package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.Order;
import com.wenwan.bracelet.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Order order = orderService.findById(id);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getOrdersByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.findByCustomerId(customerId));
    }

    @GetMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<List<Order>> getOrdersByCraftsman(@PathVariable Long craftsmanId) {
        return ResponseEntity.ok(orderService.findByCraftsmanId(craftsmanId));
    }

    @GetMapping("/craftsman/{craftsmanId}/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByCraftsmanAndStatus(@PathVariable Long craftsmanId, @PathVariable String status) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status);
            return ResponseEntity.ok(orderService.findByCraftsmanIdAndStatus(craftsmanId, orderStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<Order> createOrder(@RequestBody Order order, @PathVariable Long customerId) {
        Order newOrder = orderService.createOrder(order, customerId);
        return newOrder != null ? ResponseEntity.ok(newOrder) : ResponseEntity.badRequest().build();
    }

    @PostMapping("/{orderId}/assign/{craftsmanId}")
    public ResponseEntity<Order> assignCraftsman(@PathVariable Long orderId, @PathVariable Long craftsmanId) {
        Order order = orderService.assignCraftsman(orderId, craftsmanId);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData) {
        try {
            Order.OrderStatus status = Order.OrderStatus.valueOf(statusData.get("status"));
            Order order = orderService.updateStatus(id, status);
            return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @RequestBody Order orderDetails) {
        Order order = orderService.updateOrder(id, orderDetails);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }
}