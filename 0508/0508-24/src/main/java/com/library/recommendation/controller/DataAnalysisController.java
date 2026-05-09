package com.library.recommendation.controller;

import com.library.recommendation.common.Result;
import com.library.recommendation.service.DataAnalysisService;
import com.library.recommendation.service.InterestVectorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@Tag(name = "数据分析", description = "数据分析相关接口")
public class DataAnalysisController {

    private final DataAnalysisService dataAnalysisService;
    private final InterestVectorService interestVectorService;

    public DataAnalysisController(DataAnalysisService dataAnalysisService, InterestVectorService interestVectorService) {
        this.dataAnalysisService = dataAnalysisService;
        this.interestVectorService = interestVectorService;
    }

    @GetMapping("/interest-evolution/{readerId}")
    @Operation(summary = "获取读者兴趣演化河流图数据")
    public Result<DataAnalysisService.RiverChartResult> getInterestEvolution(
            @PathVariable Long readerId,
            @RequestParam(defaultValue = "6") int months) {
        return Result.success(dataAnalysisService.getInterestEvolutionRiverChart(readerId, months));
    }

    @GetMapping("/reading-breadth/{readerId}")
    @Operation(summary = "获取读者阅读广度曲线数据")
    public Result<List<DataAnalysisService.BreadthData>> getReadingBreadth(
            @PathVariable Long readerId,
            @RequestParam(defaultValue = "6") int months) {
        return Result.success(dataAnalysisService.getReadingBreadthCurve(readerId, months));
    }

    @GetMapping("/trending-tags")
    @Operation(summary = "获取上升最快的标签（群体趋势）")
    public Result<List<DataAnalysisService.TrendingTag>> getTrendingTags(
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(dataAnalysisService.getTrendingTags(limit));
    }

    @GetMapping("/interest-vector/{readerId}")
    @Operation(summary = "获取读者当前兴趣向量")
    public Result<List<InterestVectorService.TagInterest>> getInterestVector(@PathVariable Long readerId) {
        return Result.success(interestVectorService.getCurrentInterestVector(readerId));
    }
}
