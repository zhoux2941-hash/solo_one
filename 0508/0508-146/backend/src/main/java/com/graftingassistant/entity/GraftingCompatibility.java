package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "grafting_compatibility", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"rootstock_id", "scion_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraftingCompatibility {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rootstock_id", nullable = false)
    private Plant rootstock;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scion_id", nullable = false)
    private Plant scion;
    
    @Column(name = "initial_score", nullable = false)
    private Integer initialScore = 50;
    
    @Column(name = "physiological_relation", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PhysiologicalRelation physiologicalRelation;
    
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
    
    public enum PhysiologicalRelation {
        SPECIES, GENUS, FAMILY, UNRELATED
    }
}
