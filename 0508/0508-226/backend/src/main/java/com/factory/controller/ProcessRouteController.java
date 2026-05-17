package com.factory.controller;

import com.factory.common.Result;
import com.factory.entity.Process;
import com.factory.entity.ProcessRoute;
import com.factory.service.ProcessRouteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/process-route")
public class ProcessRouteController {

    private static final Logger logger = LoggerFactory.getLogger(ProcessRouteController.class);

    @Autowired
    private ProcessRouteService processRouteService;

    @GetMapping("/page")
    public Result<Page<ProcessRoute>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long materialId) {
        logger.info("查询工艺路线列表 - page: {}, size: {}, keyword: {}, materialId: {}", page, size, keyword, materialId);
        return processRouteService.findAll(page, size, keyword, materialId);
    }

    @GetMapping("/list")
    public Result<List<ProcessRoute>> findAllEnabled() {
        logger.info("查询所有启用的工艺路线");
        return processRouteService.findAllEnabled();
    }

    @GetMapping("/{id}")
    public Result<ProcessRoute> findById(@PathVariable Long id) {
        logger.info("查询工艺路线详情 - id: {}", id);
        return processRouteService.findById(id);
    }

    @GetMapping("/{id}/processes")
    public Result<List<Process>> findProcessesByRouteId(@PathVariable Long id) {
        logger.info("查询工艺路线的工序列表 - routeId: {}", id);
        return processRouteService.findProcessesByRouteId(id);
    }

    @PostMapping
    public Result<ProcessRoute> save(@RequestBody ProcessRoute processRoute) {
        logger.info("新增工艺路线 - routeCode: {}, routeName: {}", processRoute.getRouteCode(), processRoute.getRouteName());
        return processRouteService.save(processRoute);
    }

    @PutMapping("/{id}")
    public Result<ProcessRoute> update(@PathVariable Long id, @RequestBody ProcessRoute processRoute) {
        logger.info("更新工艺路线 - id: {}, routeCode: {}, routeName: {}", id, processRoute.getRouteCode(), processRoute.getRouteName());
        return processRouteService.update(id, processRoute);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        logger.info("删除工艺路线 - id: {}", id);
        return processRouteService.delete(id);
    }
}