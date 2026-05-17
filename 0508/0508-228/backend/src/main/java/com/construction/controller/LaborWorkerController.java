package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborWorker;
import com.construction.service.LaborWorkerService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/labor/worker")
public class LaborWorkerController {

    @Resource
    private LaborWorkerService laborWorkerService;

    @GetMapping("/list")
    public Result<PageResult<LaborWorker>> getWorkerList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return laborWorkerService.getWorkerList(pageNum, pageSize, projectId, teamId, keyword, status);
    }

    @GetMapping("/{id}")
    public Result<LaborWorker> getWorkerById(@PathVariable Long id) {
        return laborWorkerService.getWorkerById(id);
    }

    @GetMapping("/active")
    public Result<List<LaborWorker>> getAllActiveWorkers(@RequestParam(required = false) Long projectId) {
        return laborWorkerService.getAllActiveWorkers(projectId);
    }

    @PostMapping
    public Result<LaborWorker> addWorker(@RequestBody LaborWorker worker) {
        return laborWorkerService.addWorker(worker);
    }

    @PutMapping("/{id}")
    public Result<LaborWorker> updateWorker(@PathVariable Long id, @RequestBody LaborWorker worker) {
        return laborWorkerService.updateWorker(id, worker);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteWorker(@PathVariable Long id) {
        return laborWorkerService.deleteWorker(id);
    }

    @PutMapping("/{id}/toggle-status")
    public Result<Void> toggleWorkerStatus(@PathVariable Long id) {
        return laborWorkerService.toggleWorkerStatus(id);
    }
}
