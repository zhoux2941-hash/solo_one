package com.company.watermonitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "water_records")
public class WaterRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Long recordId;
    
    @Column(name = "machine_id", nullable = false)
    private Long machineId;
    
    @Column(name = "remaining_liters", nullable = false)
    private Double remainingLiters;
    
    @Column(name = "report_time", nullable = false)
    private LocalDateTime reportTime;
    
    @PrePersist
    protected void onCreate() {
        if (reportTime == null) {
            reportTime = LocalDateTime.now();
        }
    }
}
