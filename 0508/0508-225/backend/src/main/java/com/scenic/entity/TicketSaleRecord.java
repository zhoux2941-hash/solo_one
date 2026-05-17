package com.scenic.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ticket_sale_record")
public class TicketSaleRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String orderNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_type_id", nullable = false)
    private TicketType ticketType;

    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 100)
    private String buyerName;

    @Column(length = 20)
    private String buyerPhone;

    @Column(length = 50)
    private String buyerIdCard;

    @Column(length = 20)
    private String saleChannel = "线下";

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
