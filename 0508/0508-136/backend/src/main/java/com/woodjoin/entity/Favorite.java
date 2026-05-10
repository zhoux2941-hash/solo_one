package com.woodjoin.entity;

import com.woodjoin.enums.JoinType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "favorites")
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private JoinType joinType;

    @Column(nullable = false)
    private Double woodLength;

    @Column(nullable = false)
    private Double woodWidth;

    @Column(nullable = false)
    private Double woodHeight;

    @Column(nullable = false)
    private Double tenonLength;

    @Column(nullable = false)
    private Double tenonWidth;

    @Column(nullable = false)
    private Double tenonHeight;

    @Column(nullable = false)
    private Double margin;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}