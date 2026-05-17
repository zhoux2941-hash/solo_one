package com.military.training.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "comprehensive_score")
public class ComprehensiveScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long traineeId;

    @Column(nullable = false)
    private Double totalScore;

    @Column(nullable = false)
    private Double averageScore;

    private Integer rank;

    private String level;

    private LocalDateTime calculateTime;
}