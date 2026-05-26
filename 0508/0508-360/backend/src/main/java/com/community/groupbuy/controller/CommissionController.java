package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.service.CommissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/commission")
public class CommissionController {

    @Autowired
    private CommissionService commissionService;

    @GetMapping("/leader/{leaderId}")
    public Result<List<Commission>> getByLeaderId(@PathVariable Long leaderId) {
        return Result.success(commissionService.getByLeaderId(leaderId));
    }

    @GetMapping("/leader/{leaderId}/status/{status}")
    public Result<List<Commission>> getByLeaderIdAndStatus(@PathVariable Long leaderId, @PathVariable String status) {
        return Result.success(commissionService.getByLeaderIdAndStatus(leaderId, status));
    }

    @GetMapping("/leader/{leaderId}/summary")
    public Result<Map<String, BigDecimal>> getCommissionSummary(@PathVariable Long leaderId) {
        return Result.success(commissionService.getCommissionSummary(leaderId));
    }

    @GetMapping("/activity/{activityId}")
    public Result<List<Commission>> getByActivityId(@PathVariable Long activityId) {
        return Result.success(commissionService.getByActivityId(activityId));
    }
}
