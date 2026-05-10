package com.lightpollution.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "observation", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_location_id", columnList = "location_id"),
    @Index(name = "idx_coords", columnList = "latitude, longitude"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "location_id")
    private Long locationId;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Integer magnitude;

    @Column(name = "location_name", length = 100)
    private String locationName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String weather;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
