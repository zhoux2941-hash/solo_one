package com.homework.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(length = 5000)
    private String content;

    private String fileName;

    private String filePath;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private Integer score;

    @Column(length = 2000)
    private String comment;

    private LocalDateTime gradedAt;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        SUBMITTED, GRADED
    }

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        status = Status.SUBMITTED;
    }
}
