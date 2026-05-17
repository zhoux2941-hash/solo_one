package com.military.training.entity;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "training_subject")
public class TrainingSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double maxScore;

    @Column(nullable = false)
    private Double passScore;

    private String description;

    private Integer sortOrder;
}