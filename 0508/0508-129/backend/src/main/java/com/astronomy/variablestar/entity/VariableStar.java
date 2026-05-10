package com.astronomy.variablestar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "variable_stars")
public class VariableStar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String constellation;

    @Column(name = "star_type", nullable = false, length = 50)
    private String starType;

    @Column(name = "ra_hours", precision = 10, scale = 6)
    private BigDecimal raHours;

    @Column(name = "dec_degrees", precision = 10, scale = 6)
    private BigDecimal decDegrees;

    @Column(name = "period_days", precision = 10, scale = 4)
    private BigDecimal periodDays;

    @Column(name = "mean_magnitude", precision = 5, scale = 2)
    private BigDecimal meanMagnitude;

    @Column(name = "min_magnitude", precision = 5, scale = 2)
    private BigDecimal minMagnitude;

    @Column(name = "max_magnitude", precision = 5, scale = 2)
    private BigDecimal maxMagnitude;

    @Column(name = "epoch_jd", precision = 15, scale = 5)
    private BigDecimal epochJd;

    @Column(name = "find_chart_url", length = 500)
    private String findChartUrl;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
