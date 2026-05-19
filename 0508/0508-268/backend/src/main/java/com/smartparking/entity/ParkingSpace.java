package com.smartparking.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "parking_space")
public class ParkingSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parking_lot_id", nullable = false)
    private Long parkingLotId;

    @Column(name = "space_no", nullable = false, length = 50)
    private String spaceNo;

    @Column(length = 50)
    private String area;

    @Column(length = 20)
    private String type;

    @Column(length = 20)
    private String status;

    @Column(name = "plate_number", length = 20)
    private String plateNumber;

    @Column(name = "occupy_time")
    private LocalDateTime occupyTime;

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
