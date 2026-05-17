package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meal_recipe")
public class MealRecipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String recipeCode;

    @Column(nullable = false, length = 100)
    private String recipeName;

    @Column(length = 50)
    private String mealType;

    @Column(length = 2000)
    private String ingredients;

    @Column(length = 2000)
    private String cookingMethod;

    @Column(precision = 10, scale = 2)
    private BigDecimal calories;

    @Column(length = 1000)
    private String nutritionalInfo;

    @Column(length = 1000)
    private String suitableFor;

    @Column(length = 1000)
    private String notSuitableFor;

    @Column(nullable = false)
    private Integer status = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
