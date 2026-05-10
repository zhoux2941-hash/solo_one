package com.flower.preservative.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_formulas")
@Data
public class CustomFormula {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "formula_code", nullable = false)
    private String formulaCode;
    
    @Column(name = "formula_name")
    private String formulaName;
    
    @Column(name = "sugar_ratio")
    private Double sugarRatio;
    
    @Column(name = "bleach_ratio")
    private Double bleachRatio;
    
    @Column(name = "citric_acid_ratio")
    private Double citricAcidRatio;
    
    @Column(name = "other_ingredients")
    private String otherIngredients;
    
    @Column(name = "fresh_days")
    private Integer freshDays;
    
    @Column(name = "cost")
    private Integer cost;
    
    @Column(name = "ease_of_use")
    private Integer easeOfUse;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "is_logged_in")
    private Boolean isLoggedIn = false;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
