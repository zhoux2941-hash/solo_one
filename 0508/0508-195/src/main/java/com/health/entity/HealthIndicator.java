package com.health.entity;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "health_indicators")
public class HealthIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String value;

    private String unit;

    private String referenceRange;

    private Boolean isAbnormal;

    private String abnormalType;
}
