package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Process;
import com.factory.entity.ProcessRoute;
import com.factory.repository.ProcessRepository;
import com.factory.repository.ProcessRouteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProcessRouteService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessRouteService.class);

    @Autowired
    private ProcessRouteRepository processRouteRepository;

    @Autowired
    private ProcessRepository processRepository;

    public Result<Page<ProcessRoute>> findAll(int page, int size, String keyword, Long materialId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<ProcessRoute> routes;
        
        if (keyword != null && !keyword.isEmpty()) {
            routes = processRouteRepository.findByRouteNameContaining(keyword, pageable);
        } else if (materialId != null) {
            routes = processRouteRepository.findByMaterialId(materialId, pageable);
        } else {
            routes = processRouteRepository.findAll(pageable);
        }
        
        logger.info("查询工艺路线列表完成，共{}条记录", routes.getTotalElements());
        return Result.success(routes);
    }

    public Result<ProcessRoute> findById(Long id) {
        logger.info("查询工艺路线详情 - id: {}", id);
        Optional<ProcessRoute> route = processRouteRepository.findById(id);
        return route.map(Result::success).orElseGet(() -> Result.error("工艺路线不存在"));
    }

    public Result<List<Process>> findProcessesByRouteId(Long routeId) {
        logger.info("查询工艺路线的工序列表 - routeId: {}", routeId);
        List<Process> processes = processRepository.findByProcessRouteIdOrderBySequence(routeId);
        return Result.success(processes);
    }

    @Transactional
    public Result<ProcessRoute> save(ProcessRoute processRoute) {
        logger.info("开始保存工艺路线 - routeCode: {}, routeName: {}", processRoute.getRouteCode(), processRoute.getRouteName());
        
        if (processRouteRepository.existsByRouteCode(processRoute.getRouteCode())) {
            logger.warn("工艺路线编码已存在 - routeCode: {}", processRoute.getRouteCode());
            return Result.error("工艺路线编码已存在");
        }
        
        try {
            if (processRoute.getProcesses() != null) {
                BigDecimal totalTime = BigDecimal.ZERO;
                for (Process process : processRoute.getProcesses()) {
                    process.setProcessRoute(processRoute);
                    if (process.getStandardTime() != null) {
                        totalTime = totalTime.add(process.getStandardTime());
                    }
                }
                processRoute.setTotalStandardTime(totalTime);
                logger.info("工艺路线包含{}道工序，总标准工时: {}", processRoute.getProcesses().size(), totalTime);
            }
            
            ProcessRoute saved = processRouteRepository.save(processRoute);
            logger.info("工艺路线保存成功 - id: {}, routeCode: {}", saved.getId(), saved.getRouteCode());
            return Result.success(saved);
        } catch (Exception e) {
            logger.error("工艺路线保存失败", e);
            return Result.error("工艺路线保存失败: " + e.getMessage());
        }
    }

    @Transactional
    public Result<ProcessRoute> update(Long id, ProcessRoute processRoute) {
        logger.info("开始更新工艺路线 - id: {}, routeCode: {}", id, processRoute.getRouteCode());
        
        Optional<ProcessRoute> existingOptional = processRouteRepository.findById(id);
        if (!existingOptional.isPresent()) {
            logger.warn("工艺路线不存在 - id: {}", id);
            return Result.error("工艺路线不存在");
        }

        ProcessRoute existing = existingOptional.get();
        
        if (!existing.getRouteCode().equals(processRoute.getRouteCode()) 
                && processRouteRepository.existsByRouteCode(processRoute.getRouteCode())) {
            logger.warn("工艺路线编码已存在 - routeCode: {}", processRoute.getRouteCode());
            return Result.error("工艺路线编码已存在");
        }

        try {
            processRepository.deleteByProcessRouteId(id);
            logger.info("已删除原有{}道工序", id);
            
            processRoute.setId(id);
            processRoute.setCreateTime(existing.getCreateTime());
            
            if (processRoute.getProcesses() != null) {
                BigDecimal totalTime = BigDecimal.ZERO;
                for (Process process : processRoute.getProcesses()) {
                    process.setProcessRoute(processRoute);
                    process.setId(null);
                    if (process.getStandardTime() != null) {
                        totalTime = totalTime.add(process.getStandardTime());
                    }
                }
                processRoute.setTotalStandardTime(totalTime);
                logger.info("更新后工艺路线包含{}道工序，总标准工时: {}", processRoute.getProcesses().size(), totalTime);
            }
            
            ProcessRoute updated = processRouteRepository.save(processRoute);
            logger.info("工艺路线更新成功 - id: {}, routeCode: {}", updated.getId(), updated.getRouteCode());
            return Result.success(updated);
        } catch (Exception e) {
            logger.error("工艺路线更新失败", e);
            return Result.error("工艺路线更新失败: " + e.getMessage());
        }
    }

    @Transactional
    public Result<Void> delete(Long id) {
        logger.info("开始删除工艺路线 - id: {}", id);
        
        if (!processRouteRepository.existsById(id)) {
            logger.warn("工艺路线不存在 - id: {}", id);
            return Result.error("工艺路线不存在");
        }
        
        try {
            processRepository.deleteByProcessRouteId(id);
            processRouteRepository.deleteById(id);
            logger.info("工艺路线删除成功 - id: {}", id);
            return Result.success();
        } catch (Exception e) {
            logger.error("工艺路线删除失败", e);
            return Result.error("工艺路线删除失败: " + e.getMessage());
        }
    }

    public Result<List<ProcessRoute>> findAllEnabled() {
        logger.info("查询所有启用的工艺路线");
        List<ProcessRoute> routes = processRouteRepository.findAll();
        routes.removeIf(route -> route.getStatus() != 1);
        return Result.success(routes);
    }
}