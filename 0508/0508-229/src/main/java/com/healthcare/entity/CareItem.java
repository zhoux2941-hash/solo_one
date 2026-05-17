package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "care_item")
public class CareItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String itemCode;

    @Column(nullable = false, length = 100)
    private String itemName;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String category;

    @Column(name = "default_frequency", length = 50)
    private String defaultFrequency;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "estimated_duration")
    private Integer estimatedDuration;

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
