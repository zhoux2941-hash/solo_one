package com.metro.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "dust_sensor_data")
public class DustSensorData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sectionId;

    @Column(nullable = false)
    private Double pm25;

    @Column(nullable = false)
    private Double pm10;

    @Column(nullable = false)
    private LocalDateTime reportTime = LocalDateTime.now();

    private Boolean warningTriggered = false;
}
