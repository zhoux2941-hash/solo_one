package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(unique = true, nullable = false)
    private String orderNo;

    @Column(nullable = false)
    private Long customerId;

    private String customerName;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal payAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    private PayStatus payStatus = PayStatus.UNPAID;

    private String shippingAddress;

    private String remark;

    private Long createdBy;

    private Long approvedBy;

    private LocalDateTime approvedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        DRAFT, PENDING_APPROVAL, APPROVED, PROCESSING,
        SHIPPED, DELIVERED, COMPLETED, CANCELLED, REFUNDED
    }

    public enum PayStatus {
        UNPAID, PAID, PARTIAL_REFUND, REFUNDED
    }
}
