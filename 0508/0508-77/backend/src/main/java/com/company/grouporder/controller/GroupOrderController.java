package com.company.grouporder.controller;

import com.company.grouporder.dto.AddItemRequest;
import com.company.grouporder.dto.CreateGroupOrderRequest;
import com.company.grouporder.dto.OrderSummary;
import com.company.grouporder.dto.ParticipantPayment;
import com.company.grouporder.dto.RecommendationItem;
import com.company.grouporder.entity.GroupOrder;
import com.company.grouporder.entity.OrderItem;
import com.company.grouporder.entity.Participant;
import com.company.grouporder.service.GroupOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class GroupOrderController {

    private final GroupOrderService groupOrderService;

    @PostMapping
    public ResponseEntity<GroupOrder> createOrder(@Valid @RequestBody CreateGroupOrderRequest request) {
        GroupOrder order = groupOrderService.createOrder(request);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/active")
    public ResponseEntity<List<GroupOrder>> getActiveOrders() {
        return ResponseEntity.ok(groupOrderService.getActiveOrders());
    }

    @GetMapping
    public ResponseEntity<List<GroupOrder>> getAllOrders() {
        return ResponseEntity.ok(groupOrderService.getAllOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<GroupOrder> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getOrderById(orderId));
    }

    @GetMapping("/{orderId}/summary")
    public ResponseEntity<OrderSummary> getOrderSummary(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getOrderSummary(orderId));
    }

    @PostMapping("/{orderId}/items")
    public ResponseEntity<OrderItem> addItem(@PathVariable Long orderId, 
                                              @Valid @RequestBody AddItemRequest request) {
        return ResponseEntity.ok(groupOrderService.addItem(orderId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long itemId, 
                                            @RequestParam String userId) {
        groupOrderService.removeItem(itemId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{orderId}/items")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getOrderItems(orderId));
    }

    @GetMapping("/{orderId}/participants")
    public ResponseEntity<List<Participant>> getParticipants(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getParticipants(orderId));
    }

    @GetMapping("/{orderId}/recommendations")
    public ResponseEntity<List<RecommendationItem>> getRecommendations(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getRecommendations(orderId));
    }

    @PostMapping("/{orderId}/end")
    public ResponseEntity<GroupOrder> endOrder(@PathVariable Long orderId, 
                                                @RequestParam String userId) {
        return ResponseEntity.ok(groupOrderService.endOrder(orderId, userId));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<GroupOrder> cancelOrder(@PathVariable Long orderId, 
                                                   @RequestParam String userId) {
        return ResponseEntity.ok(groupOrderService.cancelOrder(orderId, userId));
    }

    @GetMapping("/{orderId}/payments")
    public ResponseEntity<List<ParticipantPayment>> getPaymentDetails(@PathVariable Long orderId) {
        return ResponseEntity.ok(groupOrderService.getPaymentDetails(orderId));
    }
}
