package com.disaster.relief.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "warehouse")
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "tent_stock")
    private Integer tentStock;

    @Column(name = "water_stock")
    private Integer waterStock;

    @Column(name = "food_stock")
    private Integer foodStock;

    @Column(name = "medical_kit_stock")
    private Integer medicalKitStock;
}
