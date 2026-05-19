package com.exam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    @Column(nullable = false)
    private String answer;

    private Integer score;

    private String category;

    private Integer difficulty;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    public enum QuestionType {
        SINGLE_CHOICE,
        MULTIPLE_CHOICE,
        TRUE_FALSE,
        SHORT_ANSWER
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
