package com.logistics.park.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "warehouse_area")
public class WarehouseArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "库区编号不能为空")
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @NotBlank(message = "库区名称不能为空")
    @Column(nullable = false, length = 100)
    private String name;

    @NotNull(message = "所属仓库不能为空")
    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Transient
    private String warehouseName;

    @NotBlank(message = "区域分类不能为空")
    @Column(name = "area_category", nullable = false, length = 50)
    private String areaCategory;

    @Column(name = "shelf_count")
    private Integer shelfCount;

    @NotNull(message = "承载容量不能为空")
    @Column(nullable = false)
    private Double capacity;

    @Column(name = "used_capacity")
    private Double usedCapacity = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Warehouse.WarehouseStatus status = Warehouse.WarehouseStatus.AVAILABLE;

    @Column(length = 500)
    private String remark;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time")
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
