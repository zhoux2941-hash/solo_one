package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meal_plan")
public class MealPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_no", unique = true, nullable = false, length = 50)
    private String planNo;

    @Column(name = "elder_id", nullable = false)
    private Long elderId;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "breakfast_recipe_id")
    private Long breakfastRecipeId;

    @Column(name = "lunch_recipe_id")
    private Long lunchRecipeId;

    @Column(name = "dinner_recipe_id")
    private Long dinnerRecipeId;

    @Column(length = 1000)
    private String specialRequirements;

    @Column(length = 20)
    private String status;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "待确认";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
