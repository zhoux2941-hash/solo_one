package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "group_activity")
public class GroupActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String activityName;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(precision = 10, scale = 2)
    private BigDecimal activityPrice;

    private Integer minGroupSize = 2;

    private Integer currentGroupCount = 0;

    private Integer maxGroupCount;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer status = 0;

    private Integer isDiscount = 0;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountRate;

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