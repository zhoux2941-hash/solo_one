package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.ProductionOrder;
import com.factory.entity.ProductionSchedule;
import com.factory.service.ProductionOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/production-order")
public class ProductionOrderController {

    @Autowired
    private ProductionOrderService productionOrderService;

    @GetMapping("/page")
    public Result<Page<ProductionOrder>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return productionOrderService.findAll(page, size, keyword, status);
    }

    @GetMapping("/{id}")
    public Result<ProductionOrder> findById(@PathVariable Long id) {
        return productionOrderService.findById(id);
    }

    @GetMapping("/{id}/schedules")
    public Result<List<ProductionSchedule>> findSchedulesByOrderId(@PathVariable Long id) {
        return productionOrderService.findSchedulesByOrderId(id);
    }

    @PostMapping
    public Result<ProductionOrder> save(@RequestBody ProductionOrder productionOrder) {
        return productionOrderService.save(productionOrder);
    }

    @PutMapping("/{id}")
    public Result<ProductionOrder> update(@PathVariable Long id, @RequestBody ProductionOrder productionOrder) {
        return productionOrderService.update(id, productionOrder);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return productionOrderService.delete(id);
    }

    @PostMapping("/{id}/generate-schedule")
    public Result<ProductionOrder> generateSchedule(@PathVariable Long id) {
        return productionOrderService.generateSchedule(id);
    }

    @GetMapping("/{id}/validate-schedule")
    public Result<String> validateSchedule(@PathVariable Long id) {
        return productionOrderService.validateSchedule(id);
    }
}