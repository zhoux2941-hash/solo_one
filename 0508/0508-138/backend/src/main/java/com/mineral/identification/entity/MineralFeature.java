package com.mineral.identification.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "mineral_features")
public class MineralFeature {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mineral_id", nullable = false)
    private Mineral mineral;
    
    @Column(nullable = false)
    private String featureType;
    
    @Column(nullable = false)
    private String featureValue;
    
    @Column(precision = 5, scale = 4)
    private BigDecimal weight = BigDecimal.ONE;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
