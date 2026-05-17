package com.office.platform.controller;

import com.office.platform.common.LoginUser;
import com.office.platform.common.Result;
import com.office.platform.dto.SupplyDTO;
import com.office.platform.dto.SupplyRecordDTO;
import com.office.platform.entity.Supply;
import com.office.platform.entity.SupplyRecord;
import com.office.platform.service.SupplyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/api/supplies")
public class SupplyController {

    @Autowired
    private SupplyService supplyService;

    private Long getUserIdFromSession(HttpSession session) {
        LoginUser loginUser = LoginUser.getFromSession(session);
        return loginUser != null ? loginUser.getId() : null;
    }

    @GetMapping
    public Result<Page<Supply>> getSupplyList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Supply> supplyPage = supplyService.getSupplyList(page, size);
        return Result.success(supplyPage);
    }

    @GetMapping("/low-stock")
    public Result<List<Supply>> getLowStockSupplies() {
        List<Supply> lowStockList = supplyService.getLowStockSupplies();
        return Result.success(lowStockList);
    }

    @GetMapping("/low-stock/count")
    public Result<Long> getLowStockCount() {
        long count = supplyService.getLowStockCount();
        return Result.success(count);
    }

    @GetMapping("/{id}")
    public Result<Supply> getSupplyById(@PathVariable Long id) {
        Supply supply = supplyService.getSupplyById(id);
        if (supply == null) {
            return Result.error("用品不存在");
        }
        return Result.success(supply);
    }

    @GetMapping("/{id}/records")
    public Result<Page<SupplyRecord>> getSupplyRecords(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<SupplyRecord> recordPage = supplyService.getSupplyRecords(id, page, size);
        return Result.success(recordPage);
    }

    @PostMapping
    public Result<Supply> createSupply(@Validated @RequestBody SupplyDTO dto) {
        return supplyService.createSupply(dto);
    }

    @PutMapping("/{id}")
    public Result<Supply> updateSupply(
            @PathVariable Long id,
            @Validated @RequestBody SupplyDTO dto) {
        return supplyService.updateSupply(id, dto);
    }

    @DeleteMapping("/{id}")
    public Result<String> deleteSupply(@PathVariable Long id) {
        return supplyService.deleteSupply(id);
    }

    @PostMapping("/stock-in")
    public Result<SupplyRecord> stockIn(
            @Validated @RequestBody SupplyRecordDTO dto,
            HttpSession session) {
        Long operatorId = getUserIdFromSession(session);
        return supplyService.stockIn(dto, operatorId);
    }

    @PostMapping("/stock-out")
    public Result<SupplyRecord> stockOut(
            @Validated @RequestBody SupplyRecordDTO dto,
            HttpSession session) {
        Long operatorId = getUserIdFromSession(session);
        return supplyService.stockOut(dto, operatorId);
    }
}
