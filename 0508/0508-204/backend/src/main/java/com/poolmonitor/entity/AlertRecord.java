package com.poolmonitor.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert_record")
public class AlertRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long waterDataId;

    @Column(nullable = false)
    private String alertType;

    @Column(nullable = false)
    private String alertContent;

    @Column(nullable = false)
    private String alertLevel;

    private Boolean isHandled;

    private String handler;

    private String handleMeasure;

    private LocalDateTime handleTime;

    @Column(nullable = false)
    private LocalDateTime alertTime;

    @Column(updatable = false)
    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (alertTime == null) {
            alertTime = LocalDateTime.now();
        }
        if (isHandled == null) {
            isHandled = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}