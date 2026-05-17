package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ticket")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String ticketCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_type_id", nullable = false)
    private TicketType ticketType;

    @Column(precision = 10, scale = 2)
    private BigDecimal salePrice;

    @Column(length = 100)
    private String buyerName;

    @Column(length = 20)
    private String buyerPhone;

    @Column(length = 50)
    private String buyerIdCard;

    private Integer quantity = 1;

    @Column(length = 20)
    private String status = "未使用";

    private LocalDateTime saleTime;

    private LocalDateTime verifyTime;

    private LocalDateTime expireTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    private Employee seller;

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
