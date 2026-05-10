package com.petclean.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rescue_point")
public class RescuePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "animal_type", length = 50)
    private String animalType;

    @Column(length = 500)
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(length = 20)
    private String status = "need_rescue";

    @Column(name = "reported_by")
    private Long reportedBy;

    @Column(name = "rescued_by")
    private Long rescuedBy;

    @Column(name = "rescued_time")
    private LocalDateTime rescuedTime;

    @Column(name = "rescue_note", length = 500)
    private String rescueNote;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
