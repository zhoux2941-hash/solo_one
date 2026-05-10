package com.petclean.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rescue_record")
public class RescueRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rescue_point_id", nullable = false)
    private Long rescuePointId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "action_type", length = 20)
    private String actionType;

    @Column(length = 500)
    private String note;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
