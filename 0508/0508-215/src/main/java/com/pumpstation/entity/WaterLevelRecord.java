package com.pumpstation.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "water_level_records")
public class WaterLevelRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String pumpNo;
    
    private Double waterLevel;
    
    private LocalDateTime recordTime;
    
    @Column(updatable = false)
    private LocalDateTime createTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (recordTime == null) {
            recordTime = LocalDateTime.now();
        }
    }
}
