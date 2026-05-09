package com.exam.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "cheat_logs")
public class CheatLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    
    @Column(name = "question_id")
    private Long questionId;
    
    @Column(name = "action_type", nullable = false)
    private String actionType;
    
    @Column(name = "action_detail", columnDefinition = "TEXT")
    private String actionDetail;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}