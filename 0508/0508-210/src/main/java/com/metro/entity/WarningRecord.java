package com.metro.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "warning_record")
public class WarningRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sectionId;

    @Column(nullable = false)
    private String sectionName;

    private Double pm25;

    private Double pm10;

    @Column(nullable = false)
    private String warningType;

    @Column(nullable = false)
    private LocalDateTime warningTime = LocalDateTime.now();

    private Boolean resolved = false;

    private LocalDateTime resolveTime;

    private String resolveRemark;
}
