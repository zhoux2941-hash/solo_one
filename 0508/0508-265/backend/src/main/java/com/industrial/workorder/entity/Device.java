package com.industrial.workorder.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "device")
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String deviceCode;

    @Column(nullable = false, length = 100)
    private String deviceName;

    @Column(length = 100)
    private String deviceType;

    @Column(length = 100)
    private String productionLine;

    @Column(length = 200)
    private String location;

    @Column(length = 50)
    private String status;

    @Column(length = 500)
    private String description;

    private LocalDateTime installDate;

    private LocalDateTime lastMaintenanceTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "NORMAL";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
