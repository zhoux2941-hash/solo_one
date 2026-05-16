package com.property.maintenance.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stock_lock")
public class StockLock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "spare_part_id")
    private Long sparePartId;

    private Integer quantity;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    @Column(name = "expire_time")
    private LocalDateTime expireTime;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
