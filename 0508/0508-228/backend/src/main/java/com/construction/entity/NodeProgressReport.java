package com.construction.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "node_progress_report")
public class NodeProgressReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nodeId;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private LocalDate reportDate;

    @Column(length = 100)
    private String reporter;

    @Column(length = 20)
    private String reporterPhone;

    @Column(precision = 10, scale = 2)
    private BigDecimal completedWorkload;

    @Column(precision = 5, scale = 2)
    private BigDecimal progressRate;

    @Column(columnDefinition = "TEXT")
    private String workContent;

    @Column(columnDefinition = "TEXT")
    private String obstacles;

    @Column(columnDefinition = "TEXT")
    private String solutions;

    @Column(columnDefinition = "TEXT")
    private String nextPlan;

    @Column(length = 50)
    private String weatherCondition;

    private Integer workerCount;

    @Column(nullable = false)
    private Integer status;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = 1;
        }
        if (completedWorkload == null) {
            completedWorkload = BigDecimal.ZERO;
        }
        if (progressRate == null) {
            progressRate = BigDecimal.ZERO;
        }
        if (workerCount == null) {
            workerCount = 0;
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

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public String getReporter() {
        return reporter;
    }

    public void setReporter(String reporter) {
        this.reporter = reporter;
    }

    public String getReporterPhone() {
        return reporterPhone;
    }

    public void setReporterPhone(String reporterPhone) {
        this.reporterPhone = reporterPhone;
    }

    public BigDecimal getCompletedWorkload() {
        return completedWorkload;
    }

    public void setCompletedWorkload(BigDecimal completedWorkload) {
        this.completedWorkload = completedWorkload;
    }

    public BigDecimal getProgressRate() {
        return progressRate;
    }

    public void setProgressRate(BigDecimal progressRate) {
        this.progressRate = progressRate;
    }

    public String getWorkContent() {
        return workContent;
    }

    public void setWorkContent(String workContent) {
        this.workContent = workContent;
    }

    public String getObstacles() {
        return obstacles;
    }

    public void setObstacles(String obstacles) {
        this.obstacles = obstacles;
    }

    public String getSolutions() {
        return solutions;
    }

    public void setSolutions(String solutions) {
        this.solutions = solutions;
    }

    public String getNextPlan() {
        return nextPlan;
    }

    public void setNextPlan(String nextPlan) {
        this.nextPlan = nextPlan;
    }

    public String getWeatherCondition() {
        return weatherCondition;
    }

    public void setWeatherCondition(String weatherCondition) {
        this.weatherCondition = weatherCondition;
    }

    public Integer getWorkerCount() {
        return workerCount;
    }

    public void setWorkerCount(Integer workerCount) {
        this.workerCount = workerCount;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
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
