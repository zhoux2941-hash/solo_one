package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "finance_reports")
public class FinanceReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal revenue;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal cost;

    @Column(precision = 15, scale = 2)
    private BigDecimal profit;

    @Column(precision = 15, scale = 2)
    private BigDecimal tax;

    @Column(precision = 15, scale = 2)
    private BigDecimal shippingFee;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountAmount;

    private Integer orderCount;

    private Integer productCount;

    private Integer customerCount;

    private String region;

    private String department;

    private String salesperson;

    private String currency;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (profit == null && revenue != null && cost != null) {
            profit = revenue.subtract(cost);
        }
    }
}
