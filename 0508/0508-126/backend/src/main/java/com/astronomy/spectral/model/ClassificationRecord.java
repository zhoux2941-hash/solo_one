package com.astronomy.spectral.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "classification_records")
public class ClassificationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "user_selection")
    private String userSelection;

    @Column(name = "is_correct")
    private boolean isCorrect;

    @Column(name = "score")
    private double score;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
