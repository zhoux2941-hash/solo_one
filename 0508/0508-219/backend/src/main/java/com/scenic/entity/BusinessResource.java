package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "business_resource")
public class BusinessResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String resourceCode;

    @Column(nullable = false, length = 200)
    private String resourceName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private BusinessCategory category;

    @Column(length = 500)
    private String description;

    @Column(length = 200)
    private String location;

    @Column(length = 100)
    private String openTime;

    @Column(length = 100)
    private String closeTime;

    private Integer capacity;

    private BigDecimal price;

    @Column(length = 100)
    private String chargeStandard;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(length = 20)
    private String status = "开放";

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
