package com.quiz.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "competition")
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "category_ids", nullable = false, length = 500)
    private String categoryIds;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(name = "team_count", nullable = false)
    private Integer teamCount;

    @Enumerated(EnumType.STRING)
    private CompetitionStatus status = CompetitionStatus.CREATED;

    @Column(name = "current_question_index")
    private Integer currentQuestionIndex = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
