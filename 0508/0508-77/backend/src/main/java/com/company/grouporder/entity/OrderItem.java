package com.company.grouporder.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_items")
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "group_order_id", nullable = false)
    private Long groupOrderId;
    
    @Column(name = "item_name", nullable = false)
    private String itemName;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "participant_name", nullable = false)
    private String participantName;
    
    @Column(name = "participant_user_id", nullable = false)
    private String participantUserId;
    
    @Column(name = "subtotal", precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (subtotal == null) {
            subtotal = price.multiply(new BigDecimal(quantity));
        }
    }
}
