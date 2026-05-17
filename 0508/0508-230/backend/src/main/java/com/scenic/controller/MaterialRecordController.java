package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.MaterialRecord;
import com.scenic.service.MaterialRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/material-record")
public class MaterialRecordController {

    @Autowired
    private MaterialRecordService recordService;

    @GetMapping("/{id}")
    public Result<MaterialRecord> getById(@PathVariable Long id) {
        return recordService.findById(id)
                .map(Result::success)
                .orElse(Result.error("记录不存在"));
    }

    @GetMapping("/code/{recordCode}")
    public Result<MaterialRecord> getByRecordCode(@PathVariable String recordCode) {
        return recordService.findByRecordCode(recordCode)
                .map(Result::success)
                .orElse(Result.error("记录不存在"));
    }

    @GetMapping("/page")
    public Result<Page<MaterialRecord>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String recordType,
            @RequestParam(required = false) String materialId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        Long materialIdLong = null;
        if (materialId != null && !materialId.trim().isEmpty() && !"null".equalsIgnoreCase(materialId)) {
            try {
                materialIdLong = Long.valueOf(materialId);
            } catch (NumberFormatException e) {
                    materialIdLong = null;
                }
            }
        return Result.success(recordService.findByPage(keyword, recordType, materialIdLong, startTime, endTime, pageable));
    }

    @GetMapping("/material/{materialId}")
    public Result<List<MaterialRecord>> getByMaterialId(@PathVariable Long materialId) {
        return Result.success(recordService.findByMaterialId(materialId));
    }

    @PostMapping("/stock-in")
    public Result<MaterialRecord> stockIn(@RequestBody Map<String, Object> request) {
        MaterialRecord record = new MaterialRecord();
        record.setQuantity(Integer.valueOf(request.get("quantity").toString()));
        record.setUnitPrice(request.get("unitPrice") != null ? new java.math.BigDecimal(request.get("unitPrice").toString()) : null);
        record.setSupplier((String) request.get("supplier"));
        record.setReason((String) request.get("reason"));
        record.setRemark((String) request.get("remark"));

        Long materialId = Long.valueOf(request.get("materialId").toString());
        Long operatorId = request.get("operatorId") != null ? Long.valueOf(request.get("operatorId").toString()) : null;

        Map<String, Object> result = recordService.stockIn(record, materialId, operatorId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (MaterialRecord) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/stock-out")
    public Result<MaterialRecord> stockOut(@RequestBody Map<String, Object> request) {
        MaterialRecord record = new MaterialRecord();
        record.setQuantity(Integer.valueOf(request.get("quantity").toString()));
        record.setReceiver((String) request.get("receiver"));
        record.setReason((String) request.get("reason"));
        record.setRemark((String) request.get("remark"));

        Long materialId = Long.valueOf(request.get("materialId").toString());
        Long operatorId = request.get("operatorId") != null ? Long.valueOf(request.get("operatorId").toString()) : null;

        Map<String, Object> result = recordService.stockOut(record, materialId, operatorId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (MaterialRecord) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @PostMapping("/stock-loss")
    public Result<MaterialRecord> stockLoss(@RequestBody Map<String, Object> request) {
        MaterialRecord record = new MaterialRecord();
        record.setQuantity(Integer.valueOf(request.get("quantity").toString()));
        record.setReason((String) request.get("reason"));
        record.setRemark((String) request.get("remark"));

        Long materialId = Long.valueOf(request.get("materialId").toString());
        Long operatorId = request.get("operatorId") != null ? Long.valueOf(request.get("operatorId").toString()) : null;

        Map<String, Object> result = recordService.stockLoss(record, materialId, operatorId);
        if ((Boolean) result.get("success")) {
            return Result.success((String) result.get("message"), (MaterialRecord) result.get("data"));
        } else {
            return Result.error((String) result.get("message"));
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(recordService.getStatistics());
    }
}
