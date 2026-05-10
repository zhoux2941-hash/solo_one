package com.company.grouporder.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "group_orders")
public class GroupOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String merchant;
    
    @Column(name = "min_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal minAmount;
    
    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;
    
    @Column(name = "target_url")
    private String targetUrl;
    
    @Column(name = "initiator_name", nullable = false)
    private String initiatorName;
    
    @Column(name = "initiator_user_id", nullable = false)
    private String initiatorUserId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
    
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "final_amount", precision = 10, scale = 2)
    private BigDecimal finalAmount;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "ended_at")
    private LocalDateTime endedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = OrderStatus.ACTIVE;
        totalAmount = BigDecimal.ZERO;
        finalAmount = BigDecimal.ZERO;
    }
    
    public enum OrderStatus {
        ACTIVE, ENDED, CANCELLED
    }
}
