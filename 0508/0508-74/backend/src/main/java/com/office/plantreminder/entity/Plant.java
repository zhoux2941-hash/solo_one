package com.office.plantreminder.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "plants")
public class Plant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String species;

    @Column(name = "watering_interval_days", nullable = false)
    private Integer wateringIntervalDays;

    @Column(length = 100)
    private String location;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_watered_at")
    private LocalDateTime lastWateredAt;

    @Column(name = "next_watering_date")
    private LocalDate nextWateringDate;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Transient
    private Boolean isOverdue;

    @Transient
    private Long daysUntilNextWatering;
}
