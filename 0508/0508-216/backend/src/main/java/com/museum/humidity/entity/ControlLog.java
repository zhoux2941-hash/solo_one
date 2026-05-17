package com.museum.humidity.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "control_log")
public class ControlLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long deviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ControlType controlType;

    @Column(length = 500)
    private String message;

    private Double humidityBefore;

    private Double humidityAfter;

    private Double energyConsumption;

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
