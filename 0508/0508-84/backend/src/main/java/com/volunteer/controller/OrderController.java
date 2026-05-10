package com.volunteer.controller;

import com.volunteer.config.CommonResult;
import com.volunteer.entity.ExchangeOrder;
import com.volunteer.service.ExchangeOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    @Autowired
    private ExchangeOrderService exchangeOrderService;

    @PostMapping
    public CommonResult<ExchangeOrder> create(@RequestBody Map<String, Object> params) {
        try {
            Long userId = Long.valueOf(params.get("userId").toString());
            Long goodsId = Long.valueOf(params.get("goodsId").toString());
            Integer quantity = Integer.valueOf(params.get("quantity").toString());
            ExchangeOrder order = exchangeOrderService.create(userId, goodsId, quantity);
            return CommonResult.success("兑换成功", order);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public CommonResult<List<ExchangeOrder>> listByUser(@PathVariable Long userId) {
        return CommonResult.success(exchangeOrderService.findByUserId(userId));
    }

    @GetMapping("/pending")
    public CommonResult<List<ExchangeOrder>> listPending() {
        return CommonResult.success(exchangeOrderService.findPending());
    }

    @GetMapping("/status/{status}")
    public CommonResult<List<ExchangeOrder>> listByStatus(@PathVariable String status) {
        return CommonResult.success(exchangeOrderService.findByStatus(status));
    }

    @PostMapping("/deliver/{id}")
    public CommonResult<ExchangeOrder> deliver(@PathVariable Long id, @RequestBody Map<String, Long> params) {
        try {
            Long adminId = params.get("adminId");
            ExchangeOrder order = exchangeOrderService.deliver(id, adminId);
            return CommonResult.success("物品已发放", order);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/complete/{id}")
    public CommonResult<ExchangeOrder> complete(@PathVariable Long id, @RequestBody Map<String, Long> params) {
        try {
            Long adminId = params.get("adminId");
            ExchangeOrder order = exchangeOrderService.complete(id, adminId);
            return CommonResult.success("订单已核销", order);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }

    @PostMapping("/cancel/{id}")
    public CommonResult<ExchangeOrder> cancel(@PathVariable Long id) {
        try {
            ExchangeOrder order = exchangeOrderService.cancel(id);
            return CommonResult.success("订单已取消", order);
        } catch (Exception e) {
            return CommonResult.error(e.getMessage());
        }
    }
}
