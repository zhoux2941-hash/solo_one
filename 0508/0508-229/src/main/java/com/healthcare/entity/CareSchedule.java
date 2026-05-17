package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "care_schedule")
public class CareSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_no", unique = true, nullable = false, length = 50)
    private String scheduleNo;

    @Column(name = "elder_id", nullable = false)
    private Long elderId;

    @Column(name = "care_item_id", nullable = false)
    private Long careItemId;

    @Column(name = "caregiver_id")
    private Long caregiverId;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "schedule_time")
    private LocalTime scheduleTime;

    @Column(length = 50)
    private String frequency;

    @Column(length = 500)
    private String remark;

    @Column(length = 20)
    private String status;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = "待执行";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
