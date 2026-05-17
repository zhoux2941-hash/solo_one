package com.construction.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "labor_work_hour", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"worker_id", "statistics_date", "statistics_type"})
})
public class LaborWorkHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "worker_id")
    private Long workerId;

    @Column(nullable = false, name = "project_id")
    private Long projectId;

    @Column(nullable = false, name = "statistics_date")
    private LocalDate statisticsDate;

    @Column(nullable = false, length = 20, name = "statistics_type")
    private String statisticsType;

    @Column(name = "attendance_days")
    private Integer attendanceDays;

    @Column(name = "total_work_hours", precision = 10, scale = 2)
    private BigDecimal totalWorkHours;

    @Column(name = "overtime_hours", precision = 10, scale = 2)
    private BigDecimal overtimeHours;

    @Column(name = "normal_hours", precision = 10, scale = 2)
    private BigDecimal normalHours;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (attendanceDays == null) {
            attendanceDays = 0;
        }
        if (totalWorkHours == null) {
            totalWorkHours = BigDecimal.ZERO;
        }
        if (overtimeHours == null) {
            overtimeHours = BigDecimal.ZERO;
        }
        if (normalHours == null) {
            normalHours = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public LocalDate getStatisticsDate() {
        return statisticsDate;
    }

    public void setStatisticsDate(LocalDate statisticsDate) {
        this.statisticsDate = statisticsDate;
    }

    public String getStatisticsType() {
        return statisticsType;
    }

    public void setStatisticsType(String statisticsType) {
        this.statisticsType = statisticsType;
    }

    public Integer getAttendanceDays() {
        return attendanceDays;
    }

    public void setAttendanceDays(Integer attendanceDays) {
        this.attendanceDays = attendanceDays;
    }

    public BigDecimal getTotalWorkHours() {
        return totalWorkHours;
    }

    public void setTotalWorkHours(BigDecimal totalWorkHours) {
        this.totalWorkHours = totalWorkHours;
    }

    public BigDecimal getOvertimeHours() {
        return overtimeHours;
    }

    public void setOvertimeHours(BigDecimal overtimeHours) {
        this.overtimeHours = overtimeHours;
    }

    public BigDecimal getNormalHours() {
        return normalHours;
    }

    public void setNormalHours(BigDecimal normalHours) {
        this.normalHours = normalHours;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}
