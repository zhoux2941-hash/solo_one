package com.healthcare.repository;

import com.healthcare.entity.MealRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealRecipeRepository extends JpaRepository<MealRecipe, Long>, JpaSpecificationExecutor<MealRecipe> {
    boolean existsByRecipeCode(String recipeCode);
    boolean existsByRecipeCodeAndIdNot(String recipeCode, Long id);
    List<MealRecipe> findByStatusOrderByIdAsc(Integer status);
    List<MealRecipe> findByMealTypeAndStatusOrderByIdAsc(String mealType, Integer status);
}
