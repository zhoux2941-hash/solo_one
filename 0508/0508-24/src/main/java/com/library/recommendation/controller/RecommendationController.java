package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendation")
@Tag(name = "推荐系统", description = "智能推荐相关接口")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/{readerId}")
    @Operation(summary = "获取推荐书籍列表")
    public Result<List<RecommendationService.RecommendedBook>> recommendBooks(
            @PathVariable Long readerId,
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(recommendationService.recommendBooks(readerId, limit));
    }

    @GetMapping("/details/{readerId}")
    @Operation(summary = "获取推荐详情（包括当前兴趣和借阅历史）")
    public Result<Map<String, Object>> getRecommendationDetails(@PathVariable Long readerId) {
        return Result.success(recommendationService.getRecommendationDetails(readerId));
    }
}
