package com.example.trashbin.controller;

import com.example.trashbin.common.Result;
import com.example.trashbin.dto.EcoStarDTO;
import com.example.trashbin.dto.RankDTO;
import com.example.trashbin.service.RankingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
public class RankingController {

    @Autowired
    private RankingService rankingService;

    @GetMapping("/monthly")
    public Result<List<RankDTO>> getMonthlyTop10(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        List<RankDTO> list = rankingService.getMonthlyTop10(year, month);
        return Result.success(list);
    }

    @GetMapping("/total")
    public Result<List<RankDTO>> getTotalTop10() {
        List<RankDTO> list = rankingService.getTotalTop10();
        return Result.success(list);
    }

    @GetMapping("/eco-star")
    public Result<EcoStarDTO> getEcoStar(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        EcoStarDTO ecoStar = rankingService.getEcoStar(year, month);
        return Result.success(ecoStar);
    }

    @GetMapping("/dashboard")
    public Result<Map<String, Object>> getDashboardData(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        Map<String, Object> result = new HashMap<>();
        result.put("monthlyRank", rankingService.getMonthlyTop10(year, month));
        result.put("ecoStar", rankingService.getEcoStar(year, month));
        return Result.success(result);
    }

    @PostMapping("/refresh")
    public Result<Void> refreshCache(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        rankingService.clearMonthlyCache(year, month);
        rankingService.clearEcoStarCache(year, month);
        rankingService.clearTotalCache();
        return Result.success();
    }
}
