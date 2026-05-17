package com.metro.inspection.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "inspection_records")
public class InspectionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false)
    private String mileage;

    @Column(nullable = false)
    private String railPosition;

    @Column(nullable = false)
    private String damageType;

    @Column(nullable = false)
    private Double depth;

    @Column(nullable = false)
    private Integer lineSpeed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeverityLevel severityLevel;

    @Column(nullable = false)
    private LocalDate inspectionDate;

    @Column(nullable = false)
    private String suggestedRepairTime;

    @Column(nullable = false)
    private Boolean workOrderGenerated;
}
