package com.meteor.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "spectrum_data_points")
public class SpectrumDataPoint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spectra_id", nullable = false)
    private MeteorSpectra meteorSpectra;
    
    @Column(nullable = false)
    private Double wavelength;
    
    @Column(nullable = false)
    private Double intensity;
    
    @Column(nullable = false)
    private Integer pixelIndex;
}
