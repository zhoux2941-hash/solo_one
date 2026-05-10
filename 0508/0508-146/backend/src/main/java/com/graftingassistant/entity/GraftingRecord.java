package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "grafting_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraftingRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rootstock_id", nullable = false)
    private Plant rootstock;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scion_id", nullable = false)
    private Plant scion;
    
    @Column(name = "grafting_date", nullable = false)
    private LocalDate graftingDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GraftingMethod method = GraftingMethod.SPLICE;
    
    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 1;
    
    @Column(name = "survival_count")
    private Integer survivalCount;
    
    @Column(name = "survival_rate", precision = 5, scale = 2)
    private BigDecimal survivalRate;
    
    @Column(name = "is_completed")
    private Boolean isCompleted = false;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
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
    
    public enum GraftingMethod {
        SPLICE, BUDDING, WEDGE, APPROACH
    }
}
