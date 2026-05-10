package com.petclean.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "cleaning_record")
public class CleaningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "building_id")
    private Long buildingId;

    @Column(name = "cleaning_point_id", nullable = false)
    private Long cleaningPointId;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "points_earned")
    private Integer pointsEarned = 10;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
