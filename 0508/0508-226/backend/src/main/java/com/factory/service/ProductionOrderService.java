package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Process;
import com.factory.entity.ProcessRoute;
import com.factory.entity.ProductionOrder;
import com.factory.entity.ProductionSchedule;
import com.factory.repository.ProcessRepository;
import com.factory.repository.ProcessRouteRepository;
import com.factory.repository.ProductionOrderRepository;
import com.factory.repository.ProductionScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductionOrderService {

    @Autowired
    private ProductionOrderRepository productionOrderRepository;

    @Autowired
    private ProductionScheduleRepository productionScheduleRepository;

    @Autowired
    private ProcessRouteRepository processRouteRepository;

    @Autowired
    private ProcessRepository processRepository;

    public Result<Page<ProductionOrder>> findAll(int page, int size, String keyword, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ProductionOrder> orders;
        
        if (keyword != null && !keyword.isEmpty()) {
            orders = productionOrderRepository.findByOrderNameContaining(keyword, pageable);
        } else if (status != null && !status.isEmpty()) {
            orders = productionOrderRepository.findByStatus(status, pageable);
        } else {
            orders = productionOrderRepository.findAll(pageable);
        }
        
        return Result.success(orders);
    }

    public Result<ProductionOrder> findById(Long id) {
        Optional<ProductionOrder> order = productionOrderRepository.findById(id);
        return order.map(Result::success).orElseGet(() -> Result.error("生产订单不存在"));
    }

    public Result<List<ProductionSchedule>> findSchedulesByOrderId(Long orderId) {
        List<ProductionSchedule> schedules = productionScheduleRepository.findByOrderId(orderId);
        return Result.success(schedules);
    }

    @Transactional
    public Result<ProductionOrder> save(ProductionOrder productionOrder) {
        if (productionOrderRepository.existsByOrderCode(productionOrder.getOrderCode())) {
            return Result.error("订单编码已存在");
        }
        
        ProductionOrder saved = productionOrderRepository.save(productionOrder);
        return Result.success(saved);
    }

    @Transactional
    public Result<ProductionOrder> update(Long id, ProductionOrder productionOrder) {
        Optional<ProductionOrder> existingOptional = productionOrderRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("生产订单不存在");
        }

        ProductionOrder existing = existingOptional.get();
        
        if (!existing.getOrderCode().equals(productionOrder.getOrderCode()) 
                && productionOrderRepository.existsByOrderCode(productionOrder.getOrderCode())) {
            return Result.error("订单编码已存在");
        }

        productionOrder.setId(id);
        productionOrder.setCreateTime(existing.getCreateTime());
        ProductionOrder updated = productionOrderRepository.save(productionOrder);
        return Result.success(updated);
    }

    @Transactional
    public Result<Void> delete(Long id) {
        if (!productionOrderRepository.existsById(id)) {
            return Result.error("生产订单不存在");
        }
        productionScheduleRepository.deleteByOrderId(id);
        productionOrderRepository.deleteById(id);
        return Result.success();
    }

    @Transactional
    public Result<ProductionOrder> generateSchedule(Long orderId) {
        Optional<ProductionOrder> orderOptional = productionOrderRepository.findById(orderId);
        if (!orderOptional.isPresent()) {
            return Result.error("生产订单不存在");
        }

        ProductionOrder order = orderOptional.get();
        
        if (order.getRouteId() == null) {
            return Result.error("请先绑定工艺路线");
        }

        Optional<ProcessRoute> routeOptional = processRouteRepository.findById(order.getRouteId());
        if (!routeOptional.isPresent()) {
            return Result.error("工艺路线不存在");
        }

        List<Process> processes = processRepository.findByProcessRouteIdOrderBySequence(order.getRouteId());
        if (processes.isEmpty()) {
            return Result.error("工艺路线下无工序配置");
        }

        productionScheduleRepository.deleteByOrderId(orderId);

        List<ProductionSchedule> schedules = new ArrayList<>();
        LocalDate currentDate = order.getPlanStartDate() != null ? order.getPlanStartDate() : LocalDate.now();
        int scheduleNum = 1;

        for (Process process : processes) {
            ProductionSchedule schedule = new ProductionSchedule();
            schedule.setScheduleCode("SCH" + System.currentTimeMillis() + String.format("%03d", scheduleNum++));
            schedule.setOrderId(orderId);
            schedule.setOrderName(order.getOrderName());
            schedule.setProcessId(process.getId());
            schedule.setProcessName(process.getProcessName());
            schedule.setTeamId(process.getTeamId());
            schedule.setTeamName(process.getTeamName());
            schedule.setQuantity(order.getQuantity());
            schedule.setStandardTime(process.getStandardTime());
            schedule.setPlanDate(currentDate);
            schedule.setStatus("PLANNED");
            schedule.setProductionOrder(order);
            schedules.add(schedule);
        }

        productionScheduleRepository.saveAll(schedules);
        order.setStatus("SCHEDULED");
        ProductionOrder updated = productionOrderRepository.save(order);
        return Result.success(updated);
    }

    public Result<String> validateSchedule(Long orderId) {
        Optional<ProductionOrder> orderOptional = productionOrderRepository.findById(orderId);
        if (!orderOptional.isPresent()) {
            return Result.error("生产订单不存在");
        }

        ProductionOrder order = orderOptional.get();
        List<String> errors = new ArrayList<>();

        if (order.getQuantity() == null || order.getQuantity().doubleValue() <= 0) {
            errors.add("订单数量必须大于0");
        }

        if (order.getDeliveryDate() != null && order.getPlanStartDate() != null) {
            if (order.getDeliveryDate().isBefore(order.getPlanStartDate())) {
                errors.add("交付日期不能早于计划开始日期");
            }
        }

        if (order.getRouteId() == null) {
            errors.add("请绑定工艺路线");
        } else {
            Optional<ProcessRoute> routeOptional = processRouteRepository.findById(order.getRouteId());
            if (!routeOptional.isPresent()) {
                errors.add("工艺路线不存在");
            } else {
                List<Process> processes = processRepository.findByProcessRouteIdOrderBySequence(order.getRouteId());
                if (processes.isEmpty()) {
                    errors.add("工艺路线下未配置工序");
                }
            }
        }

        if (errors.isEmpty()) {
            return Result.success("排产验证通过");
        } else {
            return Result.error(String.join("; ", errors));
        }
    }
}