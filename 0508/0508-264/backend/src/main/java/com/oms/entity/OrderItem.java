package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false)
    private Long productId;

    private String productName;

    private String skuCode;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal subtotal;

    private String remark;
}
