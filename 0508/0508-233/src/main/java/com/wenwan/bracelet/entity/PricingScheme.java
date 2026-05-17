package com.wenwan.bracelet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pricing_schemes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PricingScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "craftsman_id", nullable = false)
    private User craftsman;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PricingType type;

    @Column(precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(precision = 5, scale = 2)
    private BigDecimal laborCostPercentage;

    @Column(precision = 10, scale = 2)
    private BigDecimal fixedLaborCost;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean isDefault;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum PricingType {
        PERCENTAGE("材料百分比"),
        FIXED("固定手工费"),
        TIERED("阶梯定价");

        private final String displayName;

        PricingType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isDefault == null) isDefault = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCraftsman() {
        return craftsman;
    }

    public void setCraftsman(User craftsman) {
        this.craftsman = craftsman;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PricingType getType() {
        return type;
    }

    public void setType(PricingType type) {
        this.type = type;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public BigDecimal getLaborCostPercentage() {
        return laborCostPercentage;
    }

    public void setLaborCostPercentage(BigDecimal laborCostPercentage) {
        this.laborCostPercentage = laborCostPercentage;
    }

    public BigDecimal getFixedLaborCost() {
        return fixedLaborCost;
    }

    public void setFixedLaborCost(BigDecimal fixedLaborCost) {
        this.fixedLaborCost = fixedLaborCost;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getDefault() {
        return isDefault;
    }

    public void setDefault(Boolean aDefault) {
        isDefault = aDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}