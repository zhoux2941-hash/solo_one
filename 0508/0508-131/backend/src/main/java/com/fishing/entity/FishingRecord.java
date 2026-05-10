package com.fishing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fishing_records", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_fish_date", columnList = "fish_date"),
    @Index(name = "idx_species", columnList = "fish_species_id"),
    @Index(name = "idx_lure", columnList = "lure_id")
})
public class FishingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "spot_id")
    private Long spotId;

    @Column(name = "fish_species_id", nullable = false)
    private Long fishSpeciesId;

    @Column(name = "lure_id", nullable = false)
    private Long lureId;

    @Column(name = "fish_date", nullable = false)
    private LocalDate fishDate;

    @Column(name = "air_temp", nullable = false, precision = 5, scale = 2)
    private BigDecimal airTemp;

    @Column(name = "water_temp", nullable = false, precision = 5, scale = 2)
    private BigDecimal waterTemp;

    @Column(name = "air_pressure", nullable = false, precision = 7, scale = 2)
    private BigDecimal airPressure;

    @Column(length = 50)
    private String weather;

    @Column(name = "water_visibility", length = 50)
    private String waterVisibility;

    @Column(name = "catch_count")
    private Integer catchCount = 1;

    @Column(name = "release_count")
    private Integer releaseCount = 0;

    @Column(name = "eco_points_earned")
    private Integer ecoPointsEarned = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fish_species_id", insertable = false, updatable = false)
    private FishSpecies fishSpecies;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lure_id", insertable = false, updatable = false)
    private Lure lure;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "spot_id", insertable = false, updatable = false)
    private FishingSpot spot;
}
