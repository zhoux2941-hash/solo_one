package com.disaster.relief.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "supply_forecast")
public class SupplyForecast {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disaster_type", nullable = false)
    private String disasterType;

    @Column(name = "disaster_intensity", nullable = false)
    private Integer disasterIntensity;

    @Column(name = "affected_population", nullable = false)
    private Integer affectedPopulation;

    @Column(name = "tent_quantity")
    private Integer tentQuantity;

    @Column(name = "water_quantity")
    private Integer waterQuantity;

    @Column(name = "food_quantity")
    private Integer foodQuantity;

    @Column(name = "medical_kit_quantity")
    private Integer medicalKitQuantity;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
