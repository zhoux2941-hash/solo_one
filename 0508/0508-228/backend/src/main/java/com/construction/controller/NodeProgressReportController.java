package com.construction.controller;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.NodeProgressReport;
import com.construction.service.NodeProgressReportService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/api/progress-report")
public class NodeProgressReportController {

    @Resource
    private NodeProgressReportService nodeProgressReportService;

    @GetMapping("/list")
    public Result<PageResult<NodeProgressReport>> getReportList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long nodeId) {
        return nodeProgressReportService.getReportList(pageNum, pageSize, projectId, nodeId);
    }

    @GetMapping("/{id}")
    public Result<NodeProgressReport> getReportById(@PathVariable Long id) {
        return nodeProgressReportService.getReportById(id);
    }

    @PostMapping
    public Result<NodeProgressReport> addReport(@RequestBody NodeProgressReport report) {
        return nodeProgressReportService.addReport(report);
    }

    @PutMapping("/{id}")
    public Result<NodeProgressReport> updateReport(@PathVariable Long id, @RequestBody NodeProgressReport report) {
        return nodeProgressReportService.updateReport(id, report);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteReport(@PathVariable Long id) {
        return nodeProgressReportService.deleteReport(id);
    }

    @GetMapping("/node/{nodeId}")
    public Result<List<NodeProgressReport>> getReportsByNodeId(@PathVariable Long nodeId) {
        return nodeProgressReportService.getReportsByNodeId(nodeId);
    }
}
