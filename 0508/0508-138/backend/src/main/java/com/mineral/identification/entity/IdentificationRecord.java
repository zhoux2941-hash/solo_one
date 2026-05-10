package com.mineral.identification.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "identification_records")
public class IdentificationRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(precision = 3, scale = 1)
    private BigDecimal inputHardness;
    
    private String inputStreak;
    
    private String inputLuster;
    
    private String inputCleavage;
    
    private Long confirmedMineralId;
    
    private String ipAddress;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
