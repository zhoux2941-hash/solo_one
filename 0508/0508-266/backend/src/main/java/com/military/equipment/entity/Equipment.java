package com.military.equipment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.military.equipment.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("equipment")
public class Equipment extends BaseEntity {
    private String rfidCode;
    private String equipmentName;
    private String equipmentModel;
    private String equipmentType;
    private Integer secretLevel;
    private Integer equipmentStatus;
    private String warehouseLocation;
    private String manufacturer;
    private LocalDate purchaseDate;
    private Integer warrantyPeriod;
    private Long currentUserId;
    private String currentUserName;
    private String currentDept;
    private String description;
}
