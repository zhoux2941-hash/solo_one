package com.lightpollution.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "location", indexes = {
    @Index(name = "idx_coords_hash", columnList = "coord_hash", unique = true),
    @Index(name = "idx_user_id", columnList = "user_id")
})
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "coord_hash", nullable = false, length = 64)
    private String coordHash;

    @Column(name = "location_name", length = 100)
    private String locationName;

    @Column(name = "latest_magnitude")
    private Integer latestMagnitude;

    @Column(name = "average_magnitude", precision = 5, scale = 2)
    private BigDecimal averageMagnitude;

    @Column(name = "min_magnitude")
    private Integer minMagnitude;

    @Column(name = "max_magnitude")
    private Integer maxMagnitude;

    @Column(name = "magnitude_trend")
    private Double magnitudeTrend;

    @Column(name = "observation_count")
    private Integer observationCount = 0;

    @Column(name = "first_observation_at")
    private LocalDateTime firstObservationAt;

    @Column(name = "latest_observation_at")
    private LocalDateTime latestObservationAt;

    @Column(name = "created_at")
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
}
