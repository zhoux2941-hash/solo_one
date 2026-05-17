package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "material")
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String materialCode;

    @Column(nullable = false, length = 200)
    private String materialName;

    @Column(length = 50)
    private String materialType;

    @Column(length = 100)
    private String specification;

    @Column(length = 100)
    private String material;

    @Column(length = 50)
    private String unit;

    @Column(length = 100)
    private String warehouse;

    private BigDecimal safetyStock;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer status = 1;

    private LocalDateTime createTime;

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