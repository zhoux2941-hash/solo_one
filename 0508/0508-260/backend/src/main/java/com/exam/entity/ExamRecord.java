package com.exam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exam_records")
public class ExamRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long examSessionId;

    private Long examPaperId;

    private Integer score;

    private Integer totalScore;

    private Boolean passed;

    @Enumerated(EnumType.STRING)
    private RecordStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    public enum RecordStatus {
        IN_PROGRESS,
        SUBMITTED,
        GRADED
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
