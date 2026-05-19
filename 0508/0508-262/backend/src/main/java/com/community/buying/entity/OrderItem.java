package com.community.buying.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_item")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(length = 100)
    private String productName;

    @Column(length = 200)
    private String productImage;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
}