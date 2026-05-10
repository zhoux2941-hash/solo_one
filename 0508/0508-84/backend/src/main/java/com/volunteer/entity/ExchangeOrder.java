package com.volunteer.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exchange_order")
public class ExchangeOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "goods_id", nullable = false)
    private Long goodsId;

    @Column(name = "goods_name", nullable = false, length = 100)
    private String goodsName;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "total_coins", nullable = false)
    private Integer totalCoins;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "delivered_by")
    private Long deliveredBy;

    @Column(name = "delivered_time")
    private LocalDateTime deliveredTime;

    @Column(name = "completed_by")
    private Long completedBy;

    @Column(name = "completed_time")
    private LocalDateTime completedTime;

    @Column(name = "create_time", nullable = false, updatable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_id", insertable = false, updatable = false)
    private Goods goods;

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
