package com.express.station.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "parcels")
public class Parcel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parcel_no", nullable = false, unique = true)
    private String parcelNo;

    @Column(nullable = false)
    private double length;

    @Column(nullable = false)
    private double width;

    @Column(nullable = false)
    private double height;

    @Column(name = "volume_cm3", nullable = false)
    private double volumeCm3;

    @Column(name = "volume_m3", nullable = false)
    private double volumeM3;

    @Column(name = "shelf_row")
    private Integer shelfRow;

    @Column(name = "shelf_col")
    private Integer shelfCol;

    @Column(name = "allocation_batch_id")
    private String allocationBatchId;

    @Column(name = "pickup_code", unique = true)
    private String pickupCode;

    @Column(name = "picked_up")
    private Boolean pickedUp;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
