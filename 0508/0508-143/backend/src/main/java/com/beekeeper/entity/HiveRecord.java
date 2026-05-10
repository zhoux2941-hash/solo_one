package com.beekeeper.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "hive_records")
public class HiveRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beehive_id", nullable = false)
    private Beehive beehive;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(name = "morning_temp")
    private Double morningTemperature;

    @Column(name = "evening_temp")
    private Double eveningTemperature;

    @Column(name = "morning_humidity")
    private Double morningHumidity;

    @Column(name = "evening_humidity")
    private Double eveningHumidity;

    @Column(name = "activity_level", nullable = false)
    private Integer activityLevel;

    @Column(name = "outside_temp")
    private Double outsideTemperature;

    @Column(name = "outside_humidity")
    private Double outsideHumidity;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
