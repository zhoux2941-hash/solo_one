package com.factory.materialcheck.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "material_code", unique = true, nullable = false)
    private String materialCode;

    @Column(name = "material_name", nullable = false)
    private String materialName;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;

    @Column(name = "unit_demand", nullable = false)
    private Integer unitDemand;

    @Column(name = "unit")
    private String unit;
}
