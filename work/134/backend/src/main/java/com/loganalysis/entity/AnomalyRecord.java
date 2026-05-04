package com.loganalysis.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_records", indexes = {
    @Index(name = "idx_anomaly_time", columnList = "anomalyTime"),
    @Index(name = "idx_anomaly_level", columnList = "anomalyLevel"),
    @Index(name = "idx_is_acknowledged", columnList = "isAcknowledged")
})
@Data
public class AnomalyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime anomalyTime;

    @Column(length = 20)
    private String anomalyType;

    @Column(length = 20)
    private String anomalyLevel;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private Double threshold;

    @Column(nullable = false)
    private Double actualValue;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 50)
    private String logType;

    @Column(length = 100)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(nullable = false)
    private Boolean isAcknowledged = false;

    @Column
    private LocalDateTime acknowledgedAt;

    @Column(length = 100)
    private String acknowledgedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isAcknowledged == null) {
            isAcknowledged = false;
        }
    }
}
