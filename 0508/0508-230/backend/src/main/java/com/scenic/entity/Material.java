package com.scenic.entity;

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

    @Column(nullable = false, unique = true, length = 50)
    private String materialCode;

    @Column(nullable = false, length = 200)
    private String materialName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private MaterialCategory category;

    @Column(length = 100)
    private String specification;

    @Column(length = 100)
    private String unit;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    private Integer currentStock = 0;

    private Integer minStock = 10;

    private Integer maxStock = 1000;

    @Column(length = 200)
    private String storageLocation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(length = 20)
    private String status = "正常";

    @Column(length = 500)
    private String remark;

    @Column(updatable = false)
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
