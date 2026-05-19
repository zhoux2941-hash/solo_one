package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "work_record")
public class WorkRecord extends BaseEntity {
    private Long workOrderId;
    private String orderNo;
    private String operation;
    private String operator;
    private LocalDateTime operateTime;
    private String remark;
}