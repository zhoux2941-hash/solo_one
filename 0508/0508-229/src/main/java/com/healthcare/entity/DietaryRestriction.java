package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "dietary_restriction")
public class DietaryRestriction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String restrictionCode;

    @Column(nullable = false, length = 100)
    private String restrictionName;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String restrictionType;

    @Column(length = 1000)
    private String forbiddenIngredients;

    @Column(nullable = false)
    private Integer status = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

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
