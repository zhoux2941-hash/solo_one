package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.ProductionSchedule;
import com.factory.service.ProductionScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/production-schedule")
public class ProductionScheduleController {

    private static final Logger logger = LoggerFactory.getLogger(ProductionScheduleController.class);

    @Autowired
    private ProductionScheduleService productionScheduleService;

    @GetMapping("/page")
    public Result<Page<ProductionSchedule>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        logger.info("查询排产计划列表 - page: {}, size: {}, teamId: {}, status: {}", page, size, teamId, status);
        return productionScheduleService.findAll(page, size, teamId, status, startDate, endDate);
    }

    @GetMapping("/{id}")
    public Result<ProductionSchedule> findById(@PathVariable Long id) {
        logger.info("查询排产计划详情 - id: {}", id);
        return productionScheduleService.findById(id);
    }

    @PostMapping
    public Result<ProductionSchedule> save(@RequestBody ProductionSchedule productionSchedule) {
        logger.info("新增排产计划 - scheduleCode: {}, orderName: {}", productionSchedule.getScheduleCode(), productionSchedule.getOrderName());
        return productionScheduleService.save(productionSchedule);
    }

    @PutMapping("/{id}")
    public Result<ProductionSchedule> update(@PathVariable Long id, @RequestBody ProductionSchedule productionSchedule) {
        logger.info("更新排产计划 - id: {}, scheduleCode: {}", id, productionSchedule.getScheduleCode());
        return productionScheduleService.update(id, productionSchedule);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        logger.info("删除排产计划 - id: {}", id);
        return productionScheduleService.delete(id);
    }

    @PutMapping("/{id}/status")
    public Result<ProductionSchedule> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> params) {
        String status = params.get("status");
        logger.info("更新排产计划状态 - id: {}, status: {}", id, status);
        return productionScheduleService.updateStatus(id, status);
    }
}