package com.scenic.controller;

import com.scenic.dto.Result;
import com.scenic.entity.TicketVerifyRecord;
import com.scenic.service.TicketVerifyRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/verify-record")
public class TicketVerifyRecordController {

    @Autowired
    private TicketVerifyRecordService verifyRecordService;

    @GetMapping("/page")
    public Result<Page<TicketVerifyRecord>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long ticketTypeId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("id").descending());
        return Result.success(verifyRecordService.findByPage(keyword, ticketTypeId, pageable));
    }

    @GetMapping("/today")
    public Result<List<TicketVerifyRecord>> getTodayRecords() {
        return Result.success(verifyRecordService.findTodayRecords());
    }

    @GetMapping("/statistics/today")
    public Result<Map<String, Object>> getTodayStatistics() {
        return Result.success(verifyRecordService.getTodayStatistics());
    }

    @GetMapping("/ticket/{ticketCode}")
    public Result<List<TicketVerifyRecord>> getByTicketCode(@PathVariable String ticketCode) {
        return Result.success(verifyRecordService.findByTicketCode(ticketCode));
    }
}
