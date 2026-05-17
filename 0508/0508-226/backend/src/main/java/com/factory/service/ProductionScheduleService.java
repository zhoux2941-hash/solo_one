package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.ProductionSchedule;
import com.factory.repository.ProductionScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class ProductionScheduleService {

    private static final Logger logger = LoggerFactory.getLogger(ProductionScheduleService.class);

    @Autowired
    private ProductionScheduleRepository productionScheduleRepository;

    public Result<Page<ProductionSchedule>> findAll(int page, int size, Long teamId, String status, LocalDate startDate, LocalDate endDate) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "planDate"));
        Page<ProductionSchedule> schedules;
        
        if (teamId != null) {
            schedules = productionScheduleRepository.findByTeamId(teamId, pageable);
        } else if (status != null && !status.isEmpty()) {
            schedules = productionScheduleRepository.findByStatus(status, pageable);
        } else if (startDate != null && endDate != null) {
            schedules = productionScheduleRepository.findByPlanDateBetween(startDate, endDate, pageable);
        } else {
            schedules = productionScheduleRepository.findAll(pageable);
        }
        
        logger.info("查询排产计划列表完成，共{}条记录", schedules.getTotalElements());
        return Result.success(schedules);
    }

    public Result<ProductionSchedule> findById(Long id) {
        logger.info("查询排产计划详情 - id: {}", id);
        Optional<ProductionSchedule> schedule = productionScheduleRepository.findById(id);
        return schedule.map(Result::success).orElseGet(() -> Result.error("排产计划不存在"));
    }

    public Result<ProductionSchedule> save(ProductionSchedule productionSchedule) {
        logger.info("开始保存排产计划 - scheduleCode: {}", productionSchedule.getScheduleCode());
        
        if (productionSchedule.getScheduleCode() != null && productionScheduleRepository.existsByScheduleCode(productionSchedule.getScheduleCode())) {
            logger.warn("排产编码已存在 - scheduleCode: {}", productionSchedule.getScheduleCode());
            return Result.error("排产编码已存在");
        }
        
        try {
            ProductionSchedule saved = productionScheduleRepository.save(productionSchedule);
            logger.info("排产计划保存成功 - id: {}, scheduleCode: {}", saved.getId(), saved.getScheduleCode());
            return Result.success(saved);
        } catch (Exception e) {
            logger.error("排产计划保存失败", e);
            return Result.error("排产计划保存失败: " + e.getMessage());
        }
    }

    public Result<ProductionSchedule> update(Long id, ProductionSchedule productionSchedule) {
        logger.info("开始更新排产计划 - id: {}", id);
        
        Optional<ProductionSchedule> existingOptional = productionScheduleRepository.findById(id);
        if (!existingOptional.isPresent()) {
            logger.warn("排产计划不存在 - id: {}", id);
            return Result.error("排产计划不存在");
        }

        ProductionSchedule existing = existingOptional.get();
        
        if (productionSchedule.getScheduleCode() != null && !existing.getScheduleCode().equals(productionSchedule.getScheduleCode()) 
                && productionScheduleRepository.existsByScheduleCode(productionSchedule.getScheduleCode())) {
            logger.warn("排产编码已存在 - scheduleCode: {}", productionSchedule.getScheduleCode());
            return Result.error("排产编码已存在");
        }

        productionSchedule.setId(id);
        productionSchedule.setCreateTime(existing.getCreateTime());
        
        try {
            ProductionSchedule updated = productionScheduleRepository.save(productionSchedule);
            logger.info("排产计划更新成功 - id: {}, scheduleCode: {}", updated.getId(), updated.getScheduleCode());
            return Result.success(updated);
        } catch (Exception e) {
            logger.error("排产计划更新失败", e);
            return Result.error("排产计划更新失败: " + e.getMessage());
        }
    }

    public Result<Void> delete(Long id) {
        logger.info("开始删除排产计划 - id: {}", id);
        
        if (!productionScheduleRepository.existsById(id)) {
            logger.warn("排产计划不存在 - id: {}", id);
            return Result.error("排产计划不存在");
        }
        
        try {
            productionScheduleRepository.deleteById(id);
            logger.info("排产计划删除成功 - id: {}", id);
            return Result.success();
        } catch (Exception e) {
            logger.error("排产计划删除失败", e);
            return Result.error("排产计划删除失败: " + e.getMessage());
        }
    }

    public Result<ProductionSchedule> updateStatus(Long id, String status) {
        logger.info("开始更新排产计划状态 - id: {}, status: {}", id, status);
        
        Optional<ProductionSchedule> existingOptional = productionScheduleRepository.findById(id);
        if (!existingOptional.isPresent()) {
            logger.warn("排产计划不存在 - id: {}", id);
            return Result.error("排产计划不存在");
        }

        try {
            ProductionSchedule schedule = existingOptional.get();
            schedule.setStatus(status);
            ProductionSchedule updated = productionScheduleRepository.save(schedule);
            logger.info("排产计划状态更新成功 - id: {}, status: {}", updated.getId(), updated.getStatus());
            return Result.success(updated);
        } catch (Exception e) {
            logger.error("排产计划状态更新失败", e);
            return Result.error("排产计划状态更新失败: " + e.getMessage());
        }
    }
}