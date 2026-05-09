package com.petboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_adjustment_rule")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAdjustmentRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    @Column(nullable = false, length = 100)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RuleType ruleType;

    @Column(precision = 5, scale = 2)
    private BigDecimal lowerThreshold;

    @Column(precision = 5, scale = 2)
    private BigDecimal upperThreshold;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal adjustmentPercentage;

    private Integer priority;

    @Column(nullable = false)
    private Boolean isActive;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum RuleType {
        OCCUPANCY_BASED, TIME_BASED, EVENT_BASED
    }

    @PrePersist
    protected void onCreate() {
        if (priority == null) {
            priority = 0;
        }
        if (isActive == null) {
            isActive = true;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
