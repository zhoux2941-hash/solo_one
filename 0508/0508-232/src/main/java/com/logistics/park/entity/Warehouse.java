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
@Table(name = "warehouse")
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "仓库编号不能为空")
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @NotBlank(message = "仓库名称不能为空")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "仓库位置不能为空")
    @Column(nullable = false, length = 200)
    private String location;

    @NotBlank(message = "存储品类不能为空")
    @Column(name = "storage_category", nullable = false, length = 100)
    private String storageCategory;

    @NotNull(message = "承载容量不能为空")
    @Column(name = "capacity", nullable = false)
    private Double capacity;

    @Column(name = "used_capacity")
    private Double usedCapacity = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WarehouseStatus status = WarehouseStatus.AVAILABLE;

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

    public enum WarehouseStatus {
        AVAILABLE("可用"),
        FULL("已满"),
        MAINTENANCE("维护中");

        private final String description;

        WarehouseStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
