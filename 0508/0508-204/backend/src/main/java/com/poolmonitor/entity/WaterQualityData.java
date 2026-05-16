package com.poolmonitor.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "water_quality_data")
public class WaterQualityData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double residualChlorine;

    @Column(nullable = false)
    private Double phValue;

    @Column(nullable = false)
    private Double turbidity;

    @Column(nullable = false)
    private Double waterTemperature;

    @Column(nullable = false)
    private LocalDateTime recordTime;

    private Boolean standard;

    private String remark;

    @Column(updatable = false)
    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (recordTime == null) {
            recordTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}