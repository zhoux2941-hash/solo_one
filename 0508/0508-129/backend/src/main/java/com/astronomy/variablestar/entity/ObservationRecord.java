package com.astronomy.variablestar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "observation_records")
public class ObservationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_star_id", nullable = false)
    private Long variableStarId;

    @Column(name = "observer_name", length = 100)
    private String observerName;

    @Column(name = "observation_time", nullable = false)
    private LocalDateTime observationTime;

    @Column(name = "reference_star_a_id")
    private Long referenceStarAId;

    @Column(name = "reference_star_b_id")
    private Long referenceStarBId;

    @Column(name = "comparison_a", precision = 5, scale = 2)
    private BigDecimal comparisonA;

    @Column(name = "comparison_b", precision = 5, scale = 2)
    private BigDecimal comparisonB;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal estimatedMagnitude;

    @Column(name = "magnitude_error", precision = 5, scale = 2)
    private BigDecimal magnitudeError;

    @Column(name = "phase", precision = 6, scale = 4)
    private BigDecimal phase;

    @Column(name = "julian_date", precision = 15, scale = 5)
    private BigDecimal julianDate;

    @Column(name = "observation_method", length = 50)
    private String observationMethod;

    @Column(name = "instrument", length = 100)
    private String instrument;

    @Column(name = "sky_conditions", length = 100)
    private String skyConditions;

    @Column(name = "notes", length = 1000)
    private String notes;

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
