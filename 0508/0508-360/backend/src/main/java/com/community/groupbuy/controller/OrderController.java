package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.Order;
import com.community.groupbuy.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public Result<Order> createOrder(@RequestBody Map<String, Object> params) {
        Long memberId = Long.valueOf(params.get("memberId").toString());
        Long activityId = Long.valueOf(params.get("activityId").toString());
        Integer quantity = Integer.valueOf(params.get("quantity").toString());
        String remark = params.get("remark") != null ? params.get("remark").toString() : "";
        try {
            Order order = orderService.createOrder(memberId, activityId, quantity, remark);
            return Result.success(order);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/pay")
    public Result<Order> pay(@PathVariable Long id) {
        try {
            return Result.success(orderService.pay(id));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/receive")
    public Result<Order> confirmReceive(@PathVariable Long id) {
        return Result.error("订单已采用取货码核销方式，请由团长扫描团员取货码完成核销。团员无需自主确认收货。");
    }

    @GetMapping("/member/{memberId}")
    public Result<List<Order>> getByMemberId(@PathVariable Long memberId) {
        return Result.success(orderService.getByMemberId(memberId));
    }

    @GetMapping("/activity/{activityId}")
    public Result<List<Order>> getByActivityId(@PathVariable Long activityId) {
        return Result.success(orderService.getByActivityId(activityId));
    }

    @GetMapping("/{id}")
    public Result<Order> getById(@PathVariable Long id) {
        return Result.success(orderService.getById(id));
    }
}
