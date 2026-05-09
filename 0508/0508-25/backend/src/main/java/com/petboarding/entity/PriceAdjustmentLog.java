package com.petboarding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_adjustment_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAdjustmentLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long adjustmentId;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false, length = 50)
    private String roomType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal adjustedPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdjustmentType adjustmentType;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal adjustmentPercentage;

    @Column(length = 255)
    private String reason;

    @Column(precision = 5, scale = 2)
    private BigDecimal occupancyRate;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdjustmentStatus status;

    private Long appliedBy;

    private LocalDateTime appliedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum AdjustmentType {
        INCREASE, DECREASE
    }

    public enum AdjustmentStatus {
        SUGGESTED, APPLIED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = AdjustmentStatus.SUGGESTED;
        }
        createdAt = LocalDateTime.now();
    }
}
