package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.Order;
import com.community.buying.entity.OrderItem;
import com.community.buying.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public Result<Order> createOrder(@RequestBody Order order,
                                     @RequestBody List<OrderItem> items,
                                     @RequestParam(required = false) Long groupActivityId) {
        return Result.success("下单成功", orderService.createOrder(order, items, groupActivityId));
    }

    @PostMapping("/{id}/pay")
    public Result<Order> simulatePayment(@PathVariable Long id) {
        Order order = orderService.simulatePayment(id);
        if (order != null) {
            return Result.success("支付成功", order);
        }
        return Result.error("订单不存在");
    }

    @GetMapping("/user/{userId}")
    public Result<List<Order>> getUserOrders(@PathVariable Long userId) {
        return Result.success(orderService.findByUserId(userId));
    }

    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasAuthority('order:read')")
    public Result<List<Order>> getStoreOrders(@PathVariable Long storeId) {
        return Result.success(orderService.findByStoreId(storeId));
    }

    @GetMapping("/{id}")
    public Result<Order> getOrderDetail(@PathVariable Long id) {
        Order order = orderService.findById(id);
        if (order != null) {
            return Result.success(order);
        }
        return Result.error("订单不存在");
    }

    @GetMapping
    @PreAuthorize("hasAuthority('order:read')")
    public Result<List<Order>> getAllOrders() {
        return Result.success(orderService.findAll());
    }

    @PutMapping("/{id}/sort-status")
    @PreAuthorize("hasAuthority('order:write')")
    public Result<Order> updateSortStatus(@PathVariable Long id, @RequestParam Integer status) {
        Order order = orderService.updateSortStatus(id, status);
        if (order != null) {
            return Result.success("分拣状态更新成功", order);
        }
        return Result.error("订单不存在");
    }

    @PutMapping("/{id}/delivery-status")
    @PreAuthorize("hasAuthority('order:write')")
    public Result<Order> updateDeliveryStatus(@PathVariable Long id, @RequestParam Integer status) {
        Order order = orderService.updateDeliveryStatus(id, status);
        if (order != null) {
            return Result.success("配送状态更新成功", order);
        }
        return Result.error("订单不存在");
    }

    @PutMapping("/{id}/assign-route")
    @PreAuthorize("hasAuthority('order:write')")
    public Result<Order> assignDeliveryRoute(@PathVariable Long id, @RequestParam Long routeId) {
        Order order = orderService.assignDeliveryRoute(id, routeId);
        if (order != null) {
            return Result.success("路线分配成功", order);
        }
        return Result.error("订单不存在");
    }

    @GetMapping("/{id}/items")
    public Result<List<OrderItem>> getOrderItems(@PathVariable Long id) {
        return Result.success(orderService.findOrderItems(id));
    }

    @PostMapping("/{id}/accept")
    public Result<Order> acceptOrder(@PathVariable Long id, @RequestParam Long deliveryPersonId) {
        try {
            Order order = orderService.acceptOrder(id, deliveryPersonId);
            return Result.success("接单成功", order);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/batch-accept")
    public Result<Map<String, Object>> batchAcceptOrders(@RequestBody List<Long> orderIds, @RequestParam Long deliveryPersonId) {
        try {
            Map<String, Object> result = orderService.batchAcceptOrders(orderIds, deliveryPersonId);
            return Result.success("批量接单完成", result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/delivery-person/{personId}")
    public Result<List<Order>> getDeliveryPersonOrders(@PathVariable Long personId) {
        return Result.success(orderService.findByDeliveryPersonId(personId));
    }

    @GetMapping("/available-for-delivery")
    public Result<List<Order>> getAvailableOrdersForDelivery() {
        return Result.success(orderService.findAvailableOrdersForDelivery());
    }
}