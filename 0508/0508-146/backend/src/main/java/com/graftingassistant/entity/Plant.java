package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "plants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "scientific_name", length = 150)
    private String scientificName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlantType type = PlantType.BOTH;
    
    @Column(length = 100)
    private String family;
    
    @Column(length = 100)
    private String genus;
    
    @Column(length = 100)
    private String species;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
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
    
    public enum PlantType {
        ROOTSTOCK, SCION, BOTH
    }
}
