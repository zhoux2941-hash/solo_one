package com.exam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "answers")
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long examRecordId;

    private Long questionId;

    @Column(columnDefinition = "TEXT")
    private String answer;

    private Integer score;

    private Boolean isCorrect;

    private LocalDateTime saveTime;

    @PrePersist
    protected void onCreate() {
        saveTime = LocalDateTime.now();
    }
}
