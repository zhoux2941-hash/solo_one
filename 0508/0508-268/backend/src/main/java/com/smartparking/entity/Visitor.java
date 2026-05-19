package com.smartparking.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "visitor")
public class Visitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "plate_number", length = 20)
    private String plateNumber;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "reason", length = 200)
    private String reason;

    @Column(name = "host", length = 50)
    private String host;

    @Column(name = "visitor_type", length = 20)
    private String visitorType;

    @Column(name = "id_card", length = 20)
    private String idCard;

    @Column(name = "parking_lot_id")
    private Long parkingLotId;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "expire_time")
    private LocalDateTime expireTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "operator", length = 50)
    private String operator;

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (entryTime == null) {
            entryTime = LocalDateTime.now();
        }
        if (expireTime == null && durationHours != null) {
            expireTime = entryTime.plusHours(durationHours);
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
