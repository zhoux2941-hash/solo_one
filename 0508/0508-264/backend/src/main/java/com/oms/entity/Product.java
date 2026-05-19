package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String productName;

    @Column(unique = true)
    private String skuCode;

    private String category;

    private String brand;

    private String unit;

    @Column(precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal salePrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal vipPrice;

    private Integer stockQuantity;

    private Integer warnQuantity;

    private String barcode;

    private String specifications;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ProductStatus {
        ACTIVE, INACTIVE, DISCONTINUED
    }
}
