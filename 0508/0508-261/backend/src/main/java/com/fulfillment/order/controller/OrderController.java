package com.fulfillment.order.controller;

import com.fulfillment.order.common.PageResult;
import com.fulfillment.order.common.Result;
import com.fulfillment.order.dto.CreateOrderDTO;
import com.fulfillment.order.dto.OrderQueryDTO;
import com.fulfillment.order.entity.FulfillmentLog;
import com.fulfillment.order.entity.Order;
import com.fulfillment.order.entity.Product;
import com.fulfillment.order.service.FulfillmentLogService;
import com.fulfillment.order.service.InventoryService;
import com.fulfillment.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;
    private final FulfillmentLogService fulfillmentLogService;
    private final InventoryService inventoryService;

    @PostMapping
    public Result<Order> createOrder(@Valid @RequestBody CreateOrderDTO dto) {
        try {
            Order order = orderService.createOrder(dto);
            return Result.success(order);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{orderNo}")
    public Result<Order> getOrder(@PathVariable String orderNo) {
        Order order = orderService.getOrderByOrderNo(orderNo);
        if (order == null) {
            return Result.error("订单不存在");
        }
        return Result.success(order);
    }

    @GetMapping
    public Result<PageResult<Order>> queryOrders(OrderQueryDTO query) {
        PageResult<Order> result = orderService.queryOrders(query);
        return Result.success(result);
    }

    @GetMapping("/cursor")
    public Result<List<Order>> queryOrdersByCursor(
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long lastId,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        List<Order> orders = orderService.queryOrdersByCursor(orderNo, userId, status, lastId, pageSize);
        return Result.success(orders);
    }

    @PostMapping("/{orderNo}/pay")
    public Result<Void> payOrder(@PathVariable String orderNo) {
        try {
            orderService.payOrder(orderNo);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{orderNo}/ship")
    public Result<Void> shipOrder(@PathVariable String orderNo) {
        try {
            orderService.shipOrder(orderNo);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{orderNo}/deliver")
    public Result<Void> deliverOrder(@PathVariable String orderNo) {
        try {
            orderService.deliverOrder(orderNo);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{orderNo}/cancel")
    public Result<Void> cancelOrder(@PathVariable String orderNo, @RequestParam(required = false, defaultValue = "用户取消") String reason) {
        try {
            orderService.cancelOrder(orderNo, reason);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{orderNo}/logs")
    public Result<List<FulfillmentLog>> getOrderLogs(@PathVariable String orderNo) {
        List<FulfillmentLog> logs = fulfillmentLogService.getLogsByOrderNo(orderNo);
        return Result.success(logs);
    }

    @GetMapping("/logs/user/{userId}")
    public Result<List<FulfillmentLog>> getUserLogs(@PathVariable Long userId) {
        List<FulfillmentLog> logs = fulfillmentLogService.getLogsByUserId(userId);
        return Result.success(logs);
    }

    @GetMapping("/products/{productId}")
    public Result<Product> getProduct(@PathVariable Long productId) {
        Product product = inventoryService.getProduct(productId);
        if (product == null) {
            return Result.error("商品不存在");
        }
        return Result.success(product);
    }
}