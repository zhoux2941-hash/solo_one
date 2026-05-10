package com.dorm.bill.controller;

import com.dorm.bill.common.Result;
import com.dorm.bill.common.UserContext;
import com.dorm.bill.dto.BillCreateRequest;
import com.dorm.bill.dto.BillDetailDTO;
import com.dorm.bill.dto.PaymentDetailDTO;
import com.dorm.bill.entity.Bill;
import com.dorm.bill.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private BillService billService;

    @PostMapping
    public Result<Bill> createBill(@RequestBody BillCreateRequest request) {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.createBill(userId, request));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping
    public Result<List<Bill>> getDormBills() {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.getDormBills(userId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/{billId}")
    public Result<BillDetailDTO> getBillDetail(@PathVariable Long billId) {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.getBillDetail(userId, billId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/{billId}/pay")
    public Result<Void> payBill(@PathVariable Long billId) {
        try {
            Long userId = UserContext.getUserId();
            billService.payBill(userId, billId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/unpaid")
    public Result<List<PaymentDetailDTO>> getUnpaidList() {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.getUnpaidList(userId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/my")
    public Result<List<Map<String, Object>>> getMyBills() {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.getMyBills(userId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> getMonthlyTrend() {
        try {
            Long userId = UserContext.getUserId();
            return Result.success(billService.getMonthlyTrend(userId));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
