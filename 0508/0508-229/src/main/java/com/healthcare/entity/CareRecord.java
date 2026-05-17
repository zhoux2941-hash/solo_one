package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "care_record")
public class CareRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_no", unique = true, nullable = false, length = 50)
    private String recordNo;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "elder_id", nullable = false)
    private Long elderId;

    @Column(name = "care_item_id", nullable = false)
    private Long careItemId;

    @Column(name = "caregiver_id", nullable = false)
    private Long caregiverId;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(length = 2000)
    private String serviceContent;

    @Column(length = 1000)
    private String elderFeedback;

    @Column(length = 20)
    private String status;

    @Column(length = 500)
    private String remark;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "已完成";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
