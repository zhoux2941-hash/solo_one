package com.delivery.controller;

import com.delivery.dto.CreateOrderDTO;
import com.delivery.dto.DispatchRecommendationDTO;
import com.delivery.dto.OrderAssignDTO;
import com.delivery.entity.Order;
import com.delivery.service.OrderService;
import com.delivery.service.SmartDispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SmartDispatchController {

    private final SmartDispatchService smartDispatchService;
    private final OrderService orderService;

    @GetMapping("/pending")
    public ResponseEntity<Map<String, List<DispatchRecommendationDTO>>> getPendingOrders() {
        return ResponseEntity.ok(smartDispatchService.getPendingOrdersWithRecommendations());
    }

    @GetMapping("/recommendations/{orderId}")
    public ResponseEntity<List<DispatchRecommendationDTO>> getRecommendations(@PathVariable String orderId) {
        return ResponseEntity.ok(smartDispatchService.getRecommendations(orderId));
    }

    @PostMapping("/order")
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderDTO dto) {
        Order order = orderService.createOrder(dto);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/assign")
    public ResponseEntity<String> assignOrder(@RequestBody OrderAssignDTO dto) {
        boolean success = orderService.assignOrder(dto);
        if (success) {
            return ResponseEntity.ok("订单已分配");
        }
        return ResponseEntity.badRequest().body("分配失败");
    }

    @DeleteMapping("/order/{orderId}")
    public ResponseEntity<String> cancelOrder(@PathVariable String orderId) {
        boolean success = orderService.cancelOrder(orderId);
        if (success) {
            return ResponseEntity.ok("订单已取消");
        }
        return ResponseEntity.badRequest().body("取消失败");
    }
}
