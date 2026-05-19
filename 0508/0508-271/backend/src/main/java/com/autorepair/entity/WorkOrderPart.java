package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "work_order_part")
public class WorkOrderPart extends BaseEntity {
    private Long workOrderId;
    private String orderNo;
    private Long partId;
    private String partNo;
    private String partName;
    private String spec;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}