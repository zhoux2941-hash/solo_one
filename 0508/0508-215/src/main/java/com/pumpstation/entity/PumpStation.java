package com.pumpstation.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "pump_stations")
public class PumpStation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String pumpNo;
    
    private Double power;
    
    private Double currentWaterLevel;
    
    private Double startWaterLevel;
    
    private Double stopWaterLevel;
    
    private Boolean isRunning;
    
    private LocalDateTime lastStartTime;
    
    private LocalDateTime lastStopTime;
    
    private Double totalDrainage;
    
    private Double totalEnergyConsumption;
    
    @Transient
    private Long operationCount;
    
    @Column(updatable = false)
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        isRunning = false;
        totalDrainage = 0.0;
        totalEnergyConsumption = 0.0;
        currentWaterLevel = 0.0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
