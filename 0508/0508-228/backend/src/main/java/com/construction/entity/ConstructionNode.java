package com.construction.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "construction_node")
public class ConstructionNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long projectId;

    private Long parentId;

    @Column(nullable = false, length = 200)
    private String nodeName;

    @Column(length = 50)
    private String nodeCode;

    @Column(length = 50)
    private String nodeType;

    private Integer nodeOrder;

    private LocalDate plannedStartDate;

    private LocalDate plannedEndDate;

    private LocalDate actualStartDate;

    private LocalDate actualEndDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal plannedWorkload;

    @Column(precision = 10, scale = 2)
    private BigDecimal completedWorkload;

    @Column(precision = 5, scale = 2)
    private BigDecimal progressRate;

    @Column(length = 100)
    private String responsiblePerson;

    @Column(length = 20)
    private String responsiblePhone;

    @Column(length = 50)
    private String currentStatus;

    @Column(columnDefinition = "TEXT")
    private String obstacles;

    @Column(length = 1000)
    private String description;

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
        if (nodeOrder == null) {
            nodeOrder = 0;
        }
        if (completedWorkload == null) {
            completedWorkload = BigDecimal.ZERO;
        }
        if (progressRate == null) {
            progressRate = BigDecimal.ZERO;
        }
        if (currentStatus == null) {
            currentStatus = "NOT_STARTED";
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

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getNodeCode() {
        return nodeCode;
    }

    public void setNodeCode(String nodeCode) {
        this.nodeCode = nodeCode;
    }

    public String getNodeType() {
        return nodeType;
    }

    public void setNodeType(String nodeType) {
        this.nodeType = nodeType;
    }

    public Integer getNodeOrder() {
        return nodeOrder;
    }

    public void setNodeOrder(Integer nodeOrder) {
        this.nodeOrder = nodeOrder;
    }

    public LocalDate getPlannedStartDate() {
        return plannedStartDate;
    }

    public void setPlannedStartDate(LocalDate plannedStartDate) {
        this.plannedStartDate = plannedStartDate;
    }

    public LocalDate getPlannedEndDate() {
        return plannedEndDate;
    }

    public void setPlannedEndDate(LocalDate plannedEndDate) {
        this.plannedEndDate = plannedEndDate;
    }

    public LocalDate getActualStartDate() {
        return actualStartDate;
    }

    public void setActualStartDate(LocalDate actualStartDate) {
        this.actualStartDate = actualStartDate;
    }

    public LocalDate getActualEndDate() {
        return actualEndDate;
    }

    public void setActualEndDate(LocalDate actualEndDate) {
        this.actualEndDate = actualEndDate;
    }

    public BigDecimal getPlannedWorkload() {
        return plannedWorkload;
    }

    public void setPlannedWorkload(BigDecimal plannedWorkload) {
        this.plannedWorkload = plannedWorkload;
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

    public String getResponsiblePerson() {
        return responsiblePerson;
    }

    public void setResponsiblePerson(String responsiblePerson) {
        this.responsiblePerson = responsiblePerson;
    }

    public String getResponsiblePhone() {
        return responsiblePhone;
    }

    public void setResponsiblePhone(String responsiblePhone) {
        this.responsiblePhone = responsiblePhone;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(String currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getObstacles() {
        return obstacles;
    }

    public void setObstacles(String obstacles) {
        this.obstacles = obstacles;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
