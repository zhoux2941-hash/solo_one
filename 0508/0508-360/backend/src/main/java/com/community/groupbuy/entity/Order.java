package com.community.groupbuy.entity;

import com.community.groupbuy.enums.OrderStatus;
import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "order_info")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", unique = true, nullable = false)
    private String orderNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "pay_time")
    private LocalDateTime payTime;

    @Column(name = "sorting_time")
    private LocalDateTime sortingTime;

    @Column(name = "pickup_code", length = 6)
    private String pickupCode;

    @Column(name = "pickup_code_generated_time")
    private LocalDateTime pickupCodeGeneratedTime;

    @Column(nullable = false)
    private String status;

    @Column(name = "verify_time")
    private LocalDateTime verifyTime;

    @Column(name = "receive_time")
    private LocalDateTime receiveTime;

    private String remark;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        if (status == null) {
            status = OrderStatus.PENDING_PAYMENT.getCode();
        }
    }

    @Transient
    public String getStatusDescription() {
        try {
            return OrderStatus.fromCode(status).getDescription();
        } catch (Exception e) {
            return status;
        }
    }
}
