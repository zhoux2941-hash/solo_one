package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.MealPlan;
import com.healthcare.service.MealPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meal-plan")
public class MealPlanController {
    @Autowired
    private MealPlanService mealPlanService;

    @PostMapping
    public Result<MealPlan> save(@RequestBody MealPlan mealPlan) {
        try {
            boolean valid = mealPlanService.validateMealPlan(
                mealPlan.getElderId(),
                mealPlan.getBreakfastRecipeId(),
                mealPlan.getLunchRecipeId(),
                mealPlan.getDinnerRecipeId()
            );
            if (!valid) {
                return Result.error("所选食谱不适合该长者");
            }
            MealPlan saved = mealPlanService.save(mealPlan);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        mealPlanService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<MealPlan> getById(@PathVariable Long id) {
        MealPlan mealPlan = mealPlanService.findById(id);
        return Result.success(mealPlan);
    }

    @GetMapping("/page")
    public Result<Page<MealPlan>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long elderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        Page<MealPlan> result = mealPlanService.findPage(page, size, elderId, startDate, endDate, status);
        return Result.success(result);
    }

    @PostMapping("/auto-generate")
    public Result<List<MealPlan>> autoGenerate(@RequestBody Map<String, Object> params) {
        try {
            Long elderId = Long.parseLong(params.get("elderId").toString());
            LocalDate startDate = LocalDate.parse(params.get("startDate").toString());
            LocalDate endDate = LocalDate.parse(params.get("endDate").toString());
            
            List<MealPlan> result = mealPlanService.autoGeneratePlans(elderId, startDate, endDate);
            return Result.success("自动生成成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/batch-generate")
    public Result<List<MealPlan>> batchGenerate(@RequestBody Map<String, Object> params) {
        try {
            LocalDate startDate = LocalDate.parse(params.get("startDate").toString());
            LocalDate endDate = LocalDate.parse(params.get("endDate").toString());
            String careLevel = params.get("careLevel") != null ? params.get("careLevel").toString() : null;
            
            List<MealPlan> result = mealPlanService.batchGeneratePlans(startDate, endDate, careLevel);
            return Result.success("批量生成成功", result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/validate")
    public Result<Boolean> validate(@RequestBody Map<String, Object> params) {
        try {
            Long elderId = Long.parseLong(params.get("elderId").toString());
            Long breakfastRecipeId = params.get("breakfastRecipeId") != null ? Long.parseLong(params.get("breakfastRecipeId").toString()) : null;
            Long lunchRecipeId = params.get("lunchRecipeId") != null ? Long.parseLong(params.get("lunchRecipeId").toString()) : null;
            Long dinnerRecipeId = params.get("dinnerRecipeId") != null ? Long.parseLong(params.get("dinnerRecipeId").toString()) : null;
            
            boolean valid = mealPlanService.validateMealPlan(elderId, breakfastRecipeId, lunchRecipeId, dinnerRecipeId);
            return Result.success(valid);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
