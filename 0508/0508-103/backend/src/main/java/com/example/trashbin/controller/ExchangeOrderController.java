package com.example.trashbin.controller;

import com.example.trashbin.common.Result;
import com.example.trashbin.dto.ExchangeOrderDTO;
import com.example.trashbin.entity.ExchangeOrder;
import com.example.trashbin.service.ExchangeOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order")
public class ExchangeOrderController {

    @Autowired
    private ExchangeOrderService exchangeOrderService;

    @PostMapping
    public Result<ExchangeOrder> create(@Validated @RequestBody ExchangeOrderDTO dto) {
        try {
            ExchangeOrder order = exchangeOrderService.createOrder(dto);
            return Result.success(order);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/verify")
    public Result<ExchangeOrder> verify(@PathVariable Long id) {
        try {
            ExchangeOrder order = exchangeOrderService.verifyOrder(id);
            return Result.success(order);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public Result<ExchangeOrder> cancel(@PathVariable Long id) {
        try {
            ExchangeOrder order = exchangeOrderService.cancelOrder(id);
            return Result.success(order);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/list")
    public Result<List<ExchangeOrder>> list() {
        return Result.success(exchangeOrderService.listAll());
    }

    @GetMapping("/resident/{residentId}")
    public Result<List<ExchangeOrder>> getByResidentId(@PathVariable Long residentId) {
        return Result.success(exchangeOrderService.getByResidentId(residentId));
    }

    @GetMapping("/status/{status}")
    public Result<List<ExchangeOrder>> getByStatus(@PathVariable String status) {
        return Result.success(exchangeOrderService.getByStatus(status));
    }

    @GetMapping("/{id}")
    public Result<ExchangeOrder> getById(@PathVariable Long id) {
        ExchangeOrder order = exchangeOrderService.getById(id);
        if (order == null) {
            return Result.error("订单不存在");
        }
        return Result.success(order);
    }
}
