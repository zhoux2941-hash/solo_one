package com.astronomy.variablestar.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reference_stars")
public class ReferenceStar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variable_star_id", nullable = false)
    private Long variableStarId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal magnitude;

    @Column(name = "spectral_type", length = 20)
    private String spectralType;

    @Column(name = "ra_offset_arcsec", precision = 8, scale = 2)
    private BigDecimal raOffsetArcsec;

    @Column(name = "dec_offset_arcsec", precision = 8, scale = 2)
    private BigDecimal decOffsetArcsec;

    @Column(name = "is_primary")
    private Boolean isPrimary;

    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    @Column(name = "notes", length = 500)
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
