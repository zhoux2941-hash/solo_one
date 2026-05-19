package com.military.equipment.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.annotation.RequiresRoles;
import com.military.equipment.common.PageQuery;
import com.military.equipment.common.Result;
import com.military.equipment.entity.OperationLog;
import com.military.equipment.service.OperationLogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/log")
public class OperationLogController {

    @Resource
    private OperationLogService operationLogService;

    @GetMapping("/list")
    @RequiresRoles({"ADMIN", "AUDITOR"})
    public Result<Page<OperationLog>> list(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status,
            PageQuery pageQuery) {
        return Result.success(operationLogService.list(module, type, status, pageQuery));
    }

    @GetMapping("/export")
    @RequiresRoles({"ADMIN", "AUDITOR"})
    public Result<List<OperationLog>> export(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        return Result.success(operationLogService.export(module, type, status));
    }
}
