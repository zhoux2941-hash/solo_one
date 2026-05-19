package com.autorepair.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import javax.persistence.Entity;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "work_order")
public class WorkOrder extends BaseEntity {
    private String orderNo;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long vehicleId;
    private String plateNumber;
    private String vin;
    private String brandModel;
    private BigDecimal mileage;
    private String faultDescription;
    private String serviceItems;
    private BigDecimal laborCost;
    private BigDecimal partsCost;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String status;
    private String assignTo;
    private LocalDateTime inTime;
    private LocalDateTime outTime;
    private String remark;
}