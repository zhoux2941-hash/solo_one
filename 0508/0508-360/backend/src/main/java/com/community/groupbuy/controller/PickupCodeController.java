package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.Order;
import com.community.groupbuy.service.PickupCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pickup")
public class PickupCodeController {

    @Autowired
    private PickupCodeService pickupCodeService;

    @PostMapping("/verify")
    public Result<Map<String, Object>> verifyPickupCode(@RequestBody Map<String, Object> params) {
        String pickupCode = params.get("pickupCode") != null ? params.get("pickupCode").toString() : null;
        Long leaderId = params.get("leaderId") != null ? Long.valueOf(params.get("leaderId").toString()) : null;

        if (pickupCode == null || pickupCode.length() != 6) {
            return Result.error("请输入6位取货码");
        }

        try {
            Map<String, Object> result = pickupCodeService.verifyPickupCode(pickupCode, leaderId);
            return Result.success(result);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/query/{pickupCode}")
    public Result<Order> queryPickupCode(@PathVariable String pickupCode) {
        Order order = pickupCodeService.getOrderByPickupCode(pickupCode);
        if (order == null) {
            return Result.error("取货码不存在");
        }
        return Result.success(order);
    }

    @GetMapping("/list/{activityId}")
    public Result<List<Order>> getOrdersForVerification(@PathVariable Long activityId) {
        return Result.success(pickupCodeService.getOrdersForVerification(activityId));
    }

    @PostMapping("/generate/{orderId}")
    public Result<Void> generatePickupCode(@PathVariable Long orderId) {
        try {
            pickupCodeService.generatePickupCodeForOrder(orderId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
