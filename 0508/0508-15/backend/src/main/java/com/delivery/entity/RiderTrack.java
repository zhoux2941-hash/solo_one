package com.delivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rider_tracks")
public class RiderTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_id", nullable = false)
    private String riderId;

    @Column(name = "order_id", nullable = false)
    private String orderId;

    @Column(name = "lng", nullable = false)
    private Double lng;

    @Column(name = "lat", nullable = false)
    private Double lat;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;
}
