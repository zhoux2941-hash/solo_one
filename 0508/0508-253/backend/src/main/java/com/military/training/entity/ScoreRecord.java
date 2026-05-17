package com.military.training.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "score_record", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"traineeId", "subjectId"})
})
public class ScoreRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long traineeId;

    @Column(nullable = false)
    private Long subjectId;

    @Column(nullable = false)
    private Double score;

    private LocalDate examDate;

    private String examiner;

    private String remarks;
}