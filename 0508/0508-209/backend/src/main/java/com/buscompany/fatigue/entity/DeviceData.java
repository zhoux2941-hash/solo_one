package com.buscompany.fatigue.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "device_data")
public class DeviceData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String driverNo;

    private String busNo;

    private Boolean yawning = false;

    private Boolean eyeClosed = false;

    private Boolean distracted = false;

    private Double eyeAspectRatio;

    private Integer mouthOpenness;

    private LocalDateTime timestamp = LocalDateTime.now();
}
