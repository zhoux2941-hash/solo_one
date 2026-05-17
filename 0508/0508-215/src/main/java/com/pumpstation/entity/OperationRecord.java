package com.pumpstation.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_records")
public class OperationRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String pumpNo;
    
    private String operationType;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    private Long runningDuration;
    
    private Double drainageAmount;
    
    private Double energyConsumption;
    
    private Double startWaterLevel;
    
    private Double endWaterLevel;
    
    private Double pumpEfficiency;
    
    @Column(updatable = false)
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
