package com.wenwan.bracelet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "craftsman_id")
    private User craftsman;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private String braceletName;

    @Column(columnDefinition = "TEXT")
    private String customRequirements;

    @Column(columnDefinition = "TEXT")
    private String materialConfig;

    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @Column(columnDefinition = "TEXT")
    private String designImageUrl;

    @Column(columnDefinition = "TEXT")
    private String finishedImageUrl;

    private String customerPhone;

    private String customerAddress;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime confirmedAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime deliveredAt;

    public enum OrderStatus {
        PENDING_CONFIRM("待确认"),
        CONFIRMED("已确认"),
        IN_PRODUCTION("制作中"),
        COMPLETED("已完成"),
        DELIVERED("已交付"),
        CANCELLED("已取消");

        private final String displayName;

        OrderStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = OrderStatus.PENDING_CONFIRM;
        }
        if (orderNo == null) {
            orderNo = "WW" + System.currentTimeMillis();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public User getCraftsman() {
        return craftsman;
    }

    public void setCraftsman(User craftsman) {
        this.craftsman = craftsman;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getBraceletName() {
        return braceletName;
    }

    public void setBraceletName(String braceletName) {
        this.braceletName = braceletName;
    }

    public String getCustomRequirements() {
        return customRequirements;
    }

    public void setCustomRequirements(String customRequirements) {
        this.customRequirements = customRequirements;
    }

    public String getMaterialConfig() {
        return materialConfig;
    }

    public void setMaterialConfig(String materialConfig) {
        this.materialConfig = materialConfig;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
    }

    public String getDesignImageUrl() {
        return designImageUrl;
    }

    public void setDesignImageUrl(String designImageUrl) {
        this.designImageUrl = designImageUrl;
    }

    public String getFinishedImageUrl() {
        return finishedImageUrl;
    }

    public void setFinishedImageUrl(String finishedImageUrl) {
        this.finishedImageUrl = finishedImageUrl;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}