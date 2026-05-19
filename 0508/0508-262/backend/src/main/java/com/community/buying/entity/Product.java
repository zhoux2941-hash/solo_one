package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String productName;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String images;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal groupPrice;

    private Integer stock = 0;

    private Integer sales = 0;

    private String unit;

    private String specs;

    private Integer status = 1;

    private Integer isRecommend = 0;

    private Integer sortOrder = 0;

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