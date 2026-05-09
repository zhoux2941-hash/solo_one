package com.lab.reagent.controller;

import com.lab.reagent.common.Result;
import com.lab.reagent.dto.MonthlyStatsDTO;
import com.lab.reagent.entity.Requisition;
import com.lab.reagent.entity.RequisitionRecord;
import com.lab.reagent.service.RequisitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requisition")
@CrossOrigin(origins = "*")
public class RequisitionController {
    @Autowired
    private RequisitionService requisitionService;

    @GetMapping("/list")
    public Result<List<Requisition>> list() {
        return Result.success(requisitionService.getAll());
    }

    @GetMapping("/pending")
    public Result<List<Requisition>> pending() {
        return Result.success(requisitionService.getPending());
    }

    @GetMapping("/user/{userId}")
    public Result<List<Requisition>> getByUserId(@PathVariable Long userId) {
        return Result.success(requisitionService.getByUserId(userId));
    }

    @GetMapping("/{id}")
    public Result<Requisition> getById(@PathVariable Long id) {
        return Result.success(requisitionService.getById(id));
    }

    @PostMapping("/create")
    public Result<String> create(@RequestBody Requisition requisition) {
        if (requisition.getUserId() == null || requisition.getReagentId() == null) {
            return Result.error("申请人和试剂不能为空");
        }
        if (requisition.getQuantity() == null || requisition.getQuantity() <= 0) {
            return Result.error("领用数量必须大于0");
        }
        boolean success = requisitionService.createRequisition(requisition);
        return success ? Result.success("申请提交成功") : Result.error("申请提交失败");
    }

    @PostMapping("/approve")
    public Result<String> approve(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Long approverId = Long.valueOf(params.get("approverId").toString());
        String remark = (String) params.get("remark");
        boolean success = requisitionService.approve(id, approverId, remark);
        return success ? Result.success("审批通过") : Result.error("审批失败，可能库存不足");
    }

    @PostMapping("/reject")
    public Result<String> reject(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Long approverId = Long.valueOf(params.get("approverId").toString());
        String remark = (String) params.get("remark");
        boolean success = requisitionService.reject(id, approverId, remark);
        return success ? Result.success("已驳回") : Result.error("驳回失败");
    }

    @GetMapping("/search")
    public Result<List<RequisitionRecord>> search(@RequestParam(required = false) String category,
                                                   @RequestParam(required = false) String startDate,
                                                   @RequestParam(required = false) String endDate,
                                                   @RequestParam(required = false) Long userId) {
        return Result.success(requisitionService.searchRecords(category, startDate, endDate, userId));
    }

    @GetMapping("/monthly-stats")
    public Result<List<MonthlyStatsDTO>> getMonthlyStats(@RequestParam(required = false) String yearMonth) {
        return Result.success(requisitionService.getMonthlyStats(yearMonth));
    }
}
