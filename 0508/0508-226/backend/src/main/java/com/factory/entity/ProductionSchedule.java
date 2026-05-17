package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "production_schedule")
public class ProductionSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String scheduleCode;

    @Column
    private Long orderId;

    @Column(length = 100)
    private String orderName;

    @Column
    private Long processId;

    @Column(length = 100)
    private String processName;

    @Column
    private Long teamId;

    @Column(length = 100)
    private String teamName;

    @Column
    private Long workshopId;

    @Column(length = 100)
    private String workshopName;

    @Column
    private Long productionLineId;

    @Column(length = 100)
    private String productionLineName;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal standardTime;

    @Column
    private LocalDate planDate;

    @Column(length = 20)
    private String shift;

    @Column(length = 20)
    private String status = "PLANNED";

    @Column(length = 500)
    private String description;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_order_id")
    private ProductionOrder productionOrder;

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