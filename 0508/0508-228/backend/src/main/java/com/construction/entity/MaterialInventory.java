package com.construction.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "material_inventory")
public class MaterialInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long materialId;

    @Column(nullable = false)
    private Long projectId;

    @Column(precision = 12, scale = 2)
    private BigDecimal currentQuantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalInQuantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalOutQuantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalReturnQuantity;

    @Column(name = "last_in_time")
    private LocalDateTime lastInTime;

    @Column(name = "last_out_time")
    private LocalDateTime lastOutTime;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (currentQuantity == null) {
            currentQuantity = BigDecimal.ZERO;
        }
        if (totalInQuantity == null) {
            totalInQuantity = BigDecimal.ZERO;
        }
        if (totalOutQuantity == null) {
            totalOutQuantity = BigDecimal.ZERO;
        }
        if (totalReturnQuantity == null) {
            totalReturnQuantity = BigDecimal.ZERO;
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

    public Long getMaterialId() {
        return materialId;
    }

    public void setMaterialId(Long materialId) {
        this.materialId = materialId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public BigDecimal getCurrentQuantity() {
        return currentQuantity;
    }

    public void setCurrentQuantity(BigDecimal currentQuantity) {
        this.currentQuantity = currentQuantity;
    }

    public BigDecimal getTotalInQuantity() {
        return totalInQuantity;
    }

    public void setTotalInQuantity(BigDecimal totalInQuantity) {
        this.totalInQuantity = totalInQuantity;
    }

    public BigDecimal getTotalOutQuantity() {
        return totalOutQuantity;
    }

    public void setTotalOutQuantity(BigDecimal totalOutQuantity) {
        this.totalOutQuantity = totalOutQuantity;
    }

    public BigDecimal getTotalReturnQuantity() {
        return totalReturnQuantity;
    }

    public void setTotalReturnQuantity(BigDecimal totalReturnQuantity) {
        this.totalReturnQuantity = totalReturnQuantity;
    }

    public LocalDateTime getLastInTime() {
        return lastInTime;
    }

    public void setLastInTime(LocalDateTime lastInTime) {
        this.lastInTime = lastInTime;
    }

    public LocalDateTime getLastOutTime() {
        return lastOutTime;
    }

    public void setLastOutTime(LocalDateTime lastOutTime) {
        this.lastOutTime = lastOutTime;
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
