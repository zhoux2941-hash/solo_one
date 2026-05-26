package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.SortingItem;
import com.community.groupbuy.service.SortingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sorting")
public class SortingController {

    @Autowired
    private SortingService sortingService;

    @GetMapping("/activity/{activityId}")
    public Result<List<SortingItem>> getSortingList(@PathVariable Long activityId) {
        return Result.success(sortingService.getSortingList(activityId));
    }

    @GetMapping("/activity/{activityId}/detail")
    public Result<List<Map<String, Object>>> getSortingDetail(@PathVariable Long activityId) {
        return Result.success(sortingService.getSortingDetail(activityId));
    }

    @PostMapping("/{id}/quantity")
    public Result<SortingItem> updateSortedQuantity(@PathVariable Long id, @RequestBody Map<String, Integer> params) {
        Integer quantity = params.get("quantity");
        try {
            return Result.success(sortingService.updateSortedQuantity(id, quantity));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/activity/{activityId}/complete")
    public Result<Void> completeSorting(@PathVariable Long activityId) {
        sortingService.completeSorting(activityId);
        return Result.success();
    }

    @PostMapping("/activity/{activityId}/generate")
    public Result<Void> generateSortingItems(@PathVariable Long activityId) {
        sortingService.generateSortingItems(activityId);
        return Result.success();
    }
}
