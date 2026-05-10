package com.meteor.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "emission_lines")
public class EmissionLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spectra_id", nullable = false)
    private MeteorSpectra meteorSpectra;
    
    @Column(nullable = false)
    private String element;
    
    @Column(nullable = false)
    private Double wavelength;
    
    @Column
    private Double intensity;
    
    @Column
    private Boolean isAutoDetected;
    
    @Column
    private String notes;
}
