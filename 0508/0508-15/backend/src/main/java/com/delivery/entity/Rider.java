package com.delivery.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "riders")
public class Rider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_id", nullable = false, unique = true)
    private String riderId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Column(name = "status")
    private String status;

    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_order_id")
    private String currentOrderId;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "on_time_orders")
    private Integer onTimeOrders;
}
