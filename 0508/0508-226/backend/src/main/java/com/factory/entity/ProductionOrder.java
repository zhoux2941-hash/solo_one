package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "production_order")
public class ProductionOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String orderCode;

    @Column(nullable = false, length = 200)
    private String orderName;

    @Column(length = 50)
    private String customerName;

    @Column
    private Long materialId;

    @Column(length = 100)
    private String materialName;

    @Column
    private Long routeId;

    @Column(length = 100)
    private String routeName;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(length = 50)
    private String unit;

    @Column
    private LocalDate planStartDate;

    @Column
    private LocalDate planEndDate;

    @Column
    private LocalDate deliveryDate;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(length = 500)
    private String description;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @OneToMany(mappedBy = "productionOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductionSchedule> schedules = new ArrayList<>();

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