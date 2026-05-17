package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "room_info")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String roomNo;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "room_type", length = 20)
    private String roomType;

    @Column(name = "floor_no", length = 20)
    private String floorNo;

    @Column(name = "bed_count")
    private Integer bedCount;

    @Column(name = "price_per_day", precision = 10, scale = 2)
    private BigDecimal pricePerDay;

    @Column(length = 500)
    private String facilities;

    @Column(name = "org_id")
    private Long orgId;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer status = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
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