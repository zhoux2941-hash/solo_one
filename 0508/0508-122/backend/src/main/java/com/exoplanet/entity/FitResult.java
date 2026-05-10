package com.exoplanet.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fit_results")
public class FitResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String shareToken;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String originalData;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fitData;

    @Column(nullable = false)
    private Double starRadius;

    @Column(nullable = false)
    private Double starTemperature;

    @Column(nullable = false)
    private Double planetRadius;

    @Column(nullable = false)
    private Double orbitalPeriod;

    @Column(nullable = false)
    private Double inclination;

    @Column(nullable = false)
    private Double fittedPlanetRadius;

    @Column(nullable = false)
    private Double fittedInclination;

    @Column(nullable = false)
    private Double chiSquared;

    @Column(nullable = false)
    private Double matchingDegree;

    @Column(nullable = false)
    private Double noiseLevel;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}