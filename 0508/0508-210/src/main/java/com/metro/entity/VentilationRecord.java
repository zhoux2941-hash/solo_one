package com.metro.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ventilation_record")
public class VentilationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sectionId;

    @Column(nullable = false)
    private String sectionName;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Long durationSeconds;

    private String triggerReason;

    private Double startPm25;

    private Double startPm10;

    private Double endPm25;

    private Double endPm10;

    private String effectRemark;
}
