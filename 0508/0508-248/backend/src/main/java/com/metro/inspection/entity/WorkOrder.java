package com.metro.inspection.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "work_orders")
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNo;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false)
    private String mileage;

    @Column(nullable = false)
    private String damageType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeverityLevel severityLevel;

    @Column(nullable = false)
    private String suggestedRepairTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @OneToOne
    @JoinColumn(name = "inspection_id")
    private InspectionRecord inspectionRecord;
}
