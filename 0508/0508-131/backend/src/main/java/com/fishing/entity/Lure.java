package com.fishing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "lures", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"model", "color"})
})
public class Lure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String brand;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false, length = 50)
    private String color;

    @Column(length = 50)
    private String type;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(length = 255)
    private String image;

    @Column(length = 255)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
