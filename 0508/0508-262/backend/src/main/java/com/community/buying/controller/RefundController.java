package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.entity.Refund;
import com.community.buying.service.RefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    @Autowired
    private RefundService refundService;

    @PostMapping
    public Result<Refund> createRefund(@RequestBody Refund refund) {
        return Result.success("申请提交成功", refundService.create(refund));
    }

    @GetMapping("/user/{userId}")
    public Result<List<Refund>> getUserRefunds(@PathVariable Long userId) {
        return Result.success(refundService.findByUserId(userId));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('refund:read')")
    public Result<List<Refund>> getAllRefunds() {
        return Result.success(refundService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Refund> getRefundDetail(@PathVariable Long id) {
        Refund refund = refundService.findById(id);
        if (refund != null) {
            return Result.success(refund);
        }
        return Result.error("退款申请不存在");
    }

    @PutMapping("/{id}/audit")
    @PreAuthorize("hasAuthority('refund:write')")
    public Result<Refund> auditRefund(@PathVariable Long id,
                                      @RequestParam Integer status,
                                      @RequestParam(required = false) String remark) {
        Refund refund = refundService.audit(id, status, remark);
        if (refund != null) {
            return Result.success("审核成功", refund);
        }
        return Result.error("退款申请不存在");
    }
}