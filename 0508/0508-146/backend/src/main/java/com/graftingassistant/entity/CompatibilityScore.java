package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "compatibility_scores", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"rootstock_id", "scion_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompatibilityScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rootstock_id", nullable = false)
    private Plant rootstock;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scion_id", nullable = false)
    private Plant scion;
    
    @Column(name = "bayesian_score", nullable = false)
    private Integer bayesianScore = 50;
    
    @Column(name = "total_records", nullable = false)
    private Integer totalRecords = 0;
    
    @Column(name = "total_survival_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal totalSurvivalRate = BigDecimal.ZERO;
    
    @Column(name = "average_survival_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal averageSurvivalRate = BigDecimal.ZERO;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
