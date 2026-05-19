package com.military.equipment.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.military.equipment.annotation.RequiresRoles;
import com.military.equipment.common.PageQuery;
import com.military.equipment.common.Result;
import com.military.equipment.dto.ApprovalApplyDTO;
import com.military.equipment.dto.ApprovalAuditDTO;
import com.military.equipment.entity.ApprovalProcess;
import com.military.equipment.service.ApprovalProcessService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.Valid;

@RestController
@RequestMapping("/approval")
public class ApprovalProcessController {

    @Resource
    private ApprovalProcessService approvalProcessService;

    @GetMapping("/my")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<Page<ApprovalProcess>> myList(
            @RequestParam(required = false) Integer processType,
            @RequestParam(required = false) Integer status,
            PageQuery pageQuery) {
        return Result.success(approvalProcessService.myList(processType, status, pageQuery));
    }

    @GetMapping("/pending")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR"})
    public Result<Page<ApprovalProcess>> pendingList(
            @RequestParam(required = false) Integer processType,
            PageQuery pageQuery) {
        return Result.success(approvalProcessService.pendingList(processType, pageQuery));
    }

    @GetMapping("/history")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<Page<ApprovalProcess>> historyList(
            @RequestParam(required = false) Integer processType,
            @RequestParam(required = false) Integer status,
            PageQuery pageQuery) {
        return Result.success(approvalProcessService.historyList(processType, status, pageQuery));
    }

    @GetMapping("/{id}")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<ApprovalProcess> getById(@PathVariable Long id) {
        return Result.success(approvalProcessService.getById(id));
    }

    @PostMapping("/apply")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<?> apply(@Valid @RequestBody ApprovalApplyDTO dto) {
        approvalProcessService.apply(dto);
        return Result.success();
    }

    @PostMapping("/audit")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR"})
    public Result<?> audit(@Valid @RequestBody ApprovalAuditDTO dto) {
        approvalProcessService.audit(dto);
        return Result.success();
    }

    @PostMapping("/withdraw/{id}")
    @RequiresRoles({"ADMIN", "WAREHOUSE_KEEPER", "AUDITOR", "OPERATOR"})
    public Result<?> withdraw(@PathVariable Long id) {
        approvalProcessService.withdraw(id);
        return Result.success();
    }
}
