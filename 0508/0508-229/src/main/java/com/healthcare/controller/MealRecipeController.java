package com.healthcare.controller;

import com.healthcare.common.Result;
import com.healthcare.entity.MealRecipe;
import com.healthcare.service.MealRecipeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-recipe")
public class MealRecipeController {
    @Autowired
    private MealRecipeService mealRecipeService;

    @PostMapping
    public Result<MealRecipe> save(@RequestBody MealRecipe mealRecipe) {
        try {
            MealRecipe saved = mealRecipeService.save(mealRecipe);
            return Result.success("保存成功", saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        mealRecipeService.delete(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Result<MealRecipe> getById(@PathVariable Long id) {
        MealRecipe mealRecipe = mealRecipeService.findById(id);
        return Result.success(mealRecipe);
    }

    @GetMapping("/page")
    public Result<Page<MealRecipe>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String recipeName,
            @RequestParam(required = false) String mealType) {
        Page<MealRecipe> result = mealRecipeService.findPage(page, size, recipeName, mealType);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<MealRecipe>> list() {
        List<MealRecipe> result = mealRecipeService.findAll();
        return Result.success(result);
    }

    @GetMapping("/suitable/{elderId}")
    public Result<List<MealRecipe>> getSuitableRecipes(
            @PathVariable Long elderId,
            @RequestParam(required = false, defaultValue = "早餐") String mealType) {
        List<MealRecipe> result = mealRecipeService.findSuitableRecipes(elderId, mealType);
        return Result.success(result);
    }

    @GetMapping("/validate")
    public Result<Boolean> validateRecipe(
            @RequestParam Long elderId,
            @RequestParam Long recipeId) {
        boolean suitable = mealRecipeService.isRecipeSuitable(elderId, recipeId);
        return Result.success(suitable);
    }
}
