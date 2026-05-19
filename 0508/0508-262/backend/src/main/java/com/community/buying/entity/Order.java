package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_create_time", columnList = "createTime"),
    @Index(name = "idx_pay_status", columnList = "payStatus"),
    @Index(name = "idx_create_time_pay_status", columnList = "createTime, payStatus"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_store_id", columnList = "store_id"),
    @Index(name = "idx_delivery_person_id", columnList = "delivery_person_id")
})
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String orderNo;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne
    @JoinColumn(name = "group_activity_id")
    private GroupActivity groupActivity;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal payAmount;

    private Integer payStatus = 0;

    private LocalDateTime payTime;

    private Integer orderStatus = 0;

    private Integer sortStatus = 0;

    private Integer deliveryStatus = 0;

    @ManyToOne
    @JoinColumn(name = "delivery_route_id")
    private DeliveryRoute deliveryRoute;

    @Column(length = 500)
    private String remark;

    private String pickupCode;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @Version
    private Long version;

    @ManyToOne
    @JoinColumn(name = "delivery_person_id")
    private User deliveryPerson;

    private LocalDateTime receiveTime;

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