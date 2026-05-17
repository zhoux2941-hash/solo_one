package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "venue_booking")
public class VenueBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(length = 200)
    private String applicantName;

    @Column(length = 20)
    private String applicantPhone;

    @Column(length = 100)
    private String applicantCompany;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    private Integer attendeeCount;

    @Column(length = 500)
    private String usagePurpose;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 20)
    private String status = "待审核";

    @Column(length = 500)
    private String auditRemark;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auditor_id")
    private Employee auditor;

    private LocalDateTime auditTime;

    @Column(length = 20)
    private String usageStatus = "未使用";

    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id")
    private Employee operator;

    @Column(length = 500)
    private String remark;

    @Column(updatable = false)
    private LocalDateTime createTime;

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
