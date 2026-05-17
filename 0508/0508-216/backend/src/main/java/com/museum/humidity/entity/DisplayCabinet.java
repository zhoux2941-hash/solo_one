package com.museum.humidity.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "display_cabinet")
public class DisplayCabinet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String cabinetNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExhibitType exhibitType;

    @Column(nullable = false)
    private Double targetHumidityMin;

    @Column(nullable = false)
    private Double targetHumidityMax;

    private Double currentHumidity;

    @Enumerated(EnumType.STRING)
    private DeviceStatus status;

    private LocalDateTime lastReportTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = DeviceStatus.NORMAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
