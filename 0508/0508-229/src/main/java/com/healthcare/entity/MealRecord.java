package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meal_record")
public class MealRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_no", unique = true, nullable = false, length = 50)
    private String recordNo;

    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "elder_id", nullable = false)
    private Long elderId;

    @Column(name = "meal_date", nullable = false)
    private LocalDate mealDate;

    @Column(length = 50)
    private String mealType;

    @Column(name = "recipe_id")
    private Long recipeId;

    @Column(length = 20)
    private String attendanceStatus;

    @Column(length = 1000)
    private String feedback;

    @Column(length = 500)
    private String remark;

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
