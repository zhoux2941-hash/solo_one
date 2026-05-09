package com.delivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private String orderId;

    @Column(name = "merchant_lng", nullable = false)
    private Double merchantLng;

    @Column(name = "merchant_lat", nullable = false)
    private Double merchantLat;

    @Column(name = "user_lng", nullable = false)
    private Double userLng;

    @Column(name = "user_lat", nullable = false)
    private Double userLat;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expected_delivery_time", nullable = false)
    private LocalDateTime expectedDeliveryTime;

    @Column(name = "actual_delivery_time")
    private LocalDateTime actualDeliveryTime;

    @Column(name = "rider_id")
    private String riderId;

    @Column(name = "status")
    private String status;
}
