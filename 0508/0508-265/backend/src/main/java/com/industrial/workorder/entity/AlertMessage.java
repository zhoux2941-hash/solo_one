package com.industrial.workorder.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert_message")
public class AlertMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long deviceId;

    @Transient
    private String deviceName;

    @Transient
    private String deviceCode;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String content;

    @Column(length = 20)
    private String level;

    private Boolean readFlag = false;

    private Long workOrderId;

    private LocalDateTime alertTime;

    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (alertTime == null) {
            alertTime = LocalDateTime.now();
        }
    }
}
