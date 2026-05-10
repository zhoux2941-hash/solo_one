package com.meteor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "meteor_spectra")
public class MeteorSpectra {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String originalFilename;
    
    @Column(nullable = false)
    private String storedFilename;
    
    @Column(nullable = false)
    private String filePath;
    
    @Column
    private String thumbnailPath;
    
    @Column
    private Double minWavelength;
    
    @Column
    private Double maxWavelength;
    
    @Column
    private Integer startPixelX;
    
    @Column
    private Integer startPixelY;
    
    @Column
    private Integer endPixelX;
    
    @Column
    private Integer endPixelY;
    
    @Column
    private Double velocity;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column
    private String uploaderName;
    
    @Column(nullable = false)
    private LocalDateTime uploadTime;
    
    @Column(nullable = false)
    private LocalDateTime updateTime;
    
    @Column
    private Long viewCount;
    
    @OneToMany(mappedBy = "meteorSpectra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmissionLine> emissionLines = new ArrayList<>();
    
    @OneToMany(mappedBy = "meteorSpectra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SpectrumDataPoint> spectrumData = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        uploadTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (viewCount == null) {
            viewCount = 0L;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
