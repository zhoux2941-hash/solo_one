package com.smartparking.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "billing_order")
public class BillingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", unique = true, length = 50)
    private String orderNo;

    @Column(name = "entry_id", nullable = false)
    private Long entryId;

    @Column(name = "plate_number", nullable = false, length = 20)
    private String plateNumber;

    @Column(name = "parking_lot_id", nullable = false)
    private Long parkingLotId;

    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "parking_duration")
    private Integer parkingDuration;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "order_status", length = 20)
    private String orderStatus;

    @Column(name = "pay_time")
    private LocalDateTime payTime;

    @Column(name = "pay_method", length = 20)
    private String payMethod;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "invoice_status", length = 20)
    private String invoiceStatus;

    @Column(length = 500)
    private String remark;

    @Version
    private Integer version;

    @Column(name = "create_time")
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
