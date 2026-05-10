package com.beekeeper.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "temperature_records")
public class TemperatureRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(nullable = false)
    private Double maxTemperature;

    @Column(nullable = false)
    private Double minTemperature;

    @Column(nullable = false)
    private Double avgTemperature;

    private String location;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
