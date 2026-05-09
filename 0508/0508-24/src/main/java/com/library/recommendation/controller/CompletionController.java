package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.service.CompletionRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/completion")
@Tag(name = "完本率分析", description = "阅读完本率和弃读分析相关接口")
public class CompletionController {

    private final CompletionRateService completionRateService;

    public CompletionController(CompletionRateService completionRateService) {
        this.completionRateService = completionRateService;
    }

    @GetMapping("/rate-trend/{readerId}")
    @Operation(summary = "获取读者完本率趋势")
    public Result<List<CompletionRateService.CompletionRateData>> getMonthlyCompletionRate(
            @PathVariable Long readerId,
            @RequestParam(defaultValue = "6") int months) {
        return Result.success(completionRateService.getMonthlyCompletionRate(readerId, months));
    }

    @GetMapping("/abandoned-categories/{readerId}")
    @Operation(summary = "获取读者弃读类型分析")
    public Result<List<CompletionRateService.AbandonedCategory>> getAbandonedCategories(
            @PathVariable Long readerId) {
        return Result.success(completionRateService.getAbandonedCategories(readerId));
    }

    @GetMapping("/stats/{readerId}")
    @Operation(summary = "获取读者完本率统计")
    public Result<CompletionRateService.CompletionStats> getCompletionStats(
            @PathVariable Long readerId) {
        return Result.success(completionRateService.getCompletionStats(readerId));
    }

    @GetMapping("/details/{readerId}")
    @Operation(summary = "获取最近借阅完本详情")
    public Result<List<CompletionRateService.BorrowCompletionDetail>> getRecentCompletionDetails(
            @PathVariable Long readerId,
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(completionRateService.getRecentCompletionDetails(readerId, limit));
    }
}
