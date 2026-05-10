package com.fishing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fish_species")
public class FishSpecies {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(length = 255)
    private String image;

    @Column(name = "min_temp", precision = 5, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", precision = 5, scale = 2)
    private BigDecimal maxTemp;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
