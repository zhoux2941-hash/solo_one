package com.beekeeper.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "nectar_sources")
public class NectarSource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String season;

    @Column(name = "required_degree_days", nullable = false)
    private Double requiredDegreeDays;

    @Column(name = "base_temp", nullable = false)
    private Double baseTemperature;

    @Column(name = "typical_start_month")
    private Integer typicalStartMonth;

    @Column(name = "typical_end_month")
    private Integer typicalEndMonth;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean active = true;
}
