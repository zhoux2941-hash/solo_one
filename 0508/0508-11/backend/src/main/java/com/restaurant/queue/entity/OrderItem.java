package com.restaurant.queue.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items", indexes = {
    @Index(name = "idx_item_order", columnList = "orderId"),
    @Index(name = "idx_item_category", columnList = "category")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orderId", nullable = false)
    private OrderRecord order;

    @Column(nullable = false, length = 100)
    private String dishName;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    private Boolean isHighPrice;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (price != null && quantity != null) {
            subtotal = price.multiply(BigDecimal.valueOf(quantity));
        }
        if (price != null) {
            isHighPrice = price.compareTo(BigDecimal.valueOf(50)) >= 0;
        }
    }
}
