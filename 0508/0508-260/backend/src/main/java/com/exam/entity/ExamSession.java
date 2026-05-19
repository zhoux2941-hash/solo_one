package com.exam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "exam_sessions")
public class ExamSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Long examPaperId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @ElementCollection
    private List<Long> participantIds;

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    public enum SessionStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED
    }

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
