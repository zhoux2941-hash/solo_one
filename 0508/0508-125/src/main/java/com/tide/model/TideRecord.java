package com.tide.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tide_records", indexes = {
    @Index(name = "idx_location_time", columnList = "location_id, record_time")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TideRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(name = "theoretical_height", nullable = false)
    private Double theoreticalHeight;

    @Column(name = "actual_height")
    private Double actualHeight;

    @Column(name = "photo_path")
    private String photoPath;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
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
