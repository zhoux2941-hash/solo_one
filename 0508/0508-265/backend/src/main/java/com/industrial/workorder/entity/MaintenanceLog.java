package com.industrial.workorder.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "maintenance_log")
public class MaintenanceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long workOrderId;

    @Column(nullable = false)
    private Long deviceId;

    @Transient
    private String deviceName;

    @Column(nullable = false)
    private Long maintainerId;

    @Transient
    private String maintainerName;

    @Lob
    @Column(length = 10485760)
    private String faultDescription;

    @Lob
    @Column(length = 10485760)
    private String solution;

    @Lob
    @Column(length = 10485760)
    private String replacedParts;

    private Integer laborHours;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(length = 20)
    private String result;

    private LocalDateTime createTime;

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
