package com.industrial.workorder.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "work_order")
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String orderNo;

    @Column(nullable = false)
    private Long deviceId;

    @Transient
    private String deviceName;

    @Transient
    private String deviceCode;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private String faultType;

    @Column(length = 20)
    private String priority;

    @Column(nullable = false, length = 20)
    private String status;

    private Long creatorId;

    @Transient
    private String creatorName;

    private Long assigneeId;

    @Transient
    private String assigneeName;

    private Integer currentApprovalLevel;

    private Long teamLeaderId;

    private String teamLeaderStatus;

    private Long adminId;

    private String adminStatus;

    private LocalDateTime expectCompleteTime;

    private LocalDateTime actualCompleteTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @Version
    private Integer version;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (currentApprovalLevel == null) {
            currentApprovalLevel = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
