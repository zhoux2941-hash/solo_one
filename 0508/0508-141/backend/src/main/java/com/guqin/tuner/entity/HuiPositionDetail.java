package com.guqin.tuner.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "hui_position_detail")
public class HuiPositionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tuning_record_id", nullable = false)
    private Long tuningRecordId;

    @Column(name = "hui_number", nullable = false)
    private Integer huiNumber;

    @Column(name = "theoretical_frequency", nullable = false, precision = 10, scale = 4)
    private BigDecimal theoreticalFrequency;

    @Column(name = "measured_frequency", nullable = false, precision = 10, scale = 4)
    private BigDecimal measuredFrequency;

    @Column(name = "cent_deviation", nullable = false, precision = 10, scale = 4)
    private BigDecimal centDeviation;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
