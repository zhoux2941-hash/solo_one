package com.property.maintenance.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "repair_order")
public class RepairOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no")
    private String orderNo;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "repair_type")
    private String repairType;

    private String description;

    private String address;

    @Column(name = "repairman_id")
    private Long repairmanId;

    private String status;

    @Column(name = "spare_part_id")
    private Long sparePartId;

    @Column(name = "spare_part_quantity")
    private Integer sparePartQuantity;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
