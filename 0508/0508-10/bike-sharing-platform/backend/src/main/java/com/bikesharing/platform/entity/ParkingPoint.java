package com.bikesharing.platform.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "parking_point")
public class ParkingPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_id")
    private Long pointId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "current_bikes", nullable = false)
    private Integer currentBikes;

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

    public double getUtilizationRate() {
        if (capacity == 0) return 0.0;
        return (double) currentBikes / capacity;
    }

    public String getStatus() {
        double rate = getUtilizationRate();
        if (rate > 0.8) return "OVER_SATURATED";
        if (rate < 0.2) return "SHORTAGE";
        return "NORMAL";
    }
}
