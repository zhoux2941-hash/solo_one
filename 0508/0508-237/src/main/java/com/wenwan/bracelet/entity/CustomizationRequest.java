package com.wenwan.bracelet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customization_requests")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomizationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String requestNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_craftsman_id")
    private User assignedCraftsman;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reference_template_id")
    private StyleTemplate referenceTemplate;

    @Enumerated(EnumType.STRING)
    private Gender wearerGender;

    private BigDecimal wristCircumference;

    private String preferredColors;

    @Column(columnDefinition = "TEXT")
    private String auspiciousMeaning;

    @Column(precision = 10, scale = 2)
    private BigDecimal minBudget;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxBudget;

    @Enumerated(EnumType.STRING)
    private UsagePurpose usagePurpose;

    @Column(columnDefinition = "TEXT")
    private String materialAvoidance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    private String customerName;

    private String customerPhone;

    @Column(columnDefinition = "TEXT")
    private String customerRemark;

    @Column(columnDefinition = "TEXT")
    private String adminRemark;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime assignedAt;

    private LocalDateTime completedAt;

    public enum Gender {
        MALE("男"),
        FEMALE("女"),
        UNISEX("男女通用");

        private final String displayName;

        Gender(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum UsagePurpose {
        SELF_USE("自戴"),
        GIFT("送礼"),
        COLLECTION("收藏"),
        OTHER("其他");

        private final String displayName;

        UsagePurpose(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum RequestStatus {
        PENDING("待分配"),
        ASSIGNED("已分配"),
        IN_PROGRESS("处理中"),
        QUOTED("已报价"),
        CONFIRMED("已确认"),
        COMPLETED("已完成"),
        CANCELLED("已取消");

        private final String displayName;

        RequestStatus(String displayName) {
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
            status = RequestStatus.PENDING;
        }
        if (requestNo == null) {
            requestNo = "CR" + System.currentTimeMillis();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestNo() {
        return requestNo;
    }

    public void setRequestNo(String requestNo) {
        this.requestNo = requestNo;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public User getAssignedCraftsman() {
        return assignedCraftsman;
    }

    public void setAssignedCraftsman(User assignedCraftsman) {
        this.assignedCraftsman = assignedCraftsman;
    }

    public StyleTemplate getReferenceTemplate() {
        return referenceTemplate;
    }

    public void setReferenceTemplate(StyleTemplate referenceTemplate) {
        this.referenceTemplate = referenceTemplate;
    }

    public Gender getWearerGender() {
        return wearerGender;
    }

    public void setWearerGender(Gender wearerGender) {
        this.wearerGender = wearerGender;
    }

    public BigDecimal getWristCircumference() {
        return wristCircumference;
    }

    public void setWristCircumference(BigDecimal wristCircumference) {
        this.wristCircumference = wristCircumference;
    }

    public String getPreferredColors() {
        return preferredColors;
    }

    public void setPreferredColors(String preferredColors) {
        this.preferredColors = preferredColors;
    }

    public String getAuspiciousMeaning() {
        return auspiciousMeaning;
    }

    public void setAuspiciousMeaning(String auspiciousMeaning) {
        this.auspiciousMeaning = auspiciousMeaning;
    }

    public BigDecimal getMinBudget() {
        return minBudget;
    }

    public void setMinBudget(BigDecimal minBudget) {
        this.minBudget = minBudget;
    }

    public BigDecimal getMaxBudget() {
        return maxBudget;
    }

    public void setMaxBudget(BigDecimal maxBudget) {
        this.maxBudget = maxBudget;
    }

    public UsagePurpose getUsagePurpose() {
        return usagePurpose;
    }

    public void setUsagePurpose(UsagePurpose usagePurpose) {
        this.usagePurpose = usagePurpose;
    }

    public String getMaterialAvoidance() {
        return materialAvoidance;
    }

    public void setMaterialAvoidance(String materialAvoidance) {
        this.materialAvoidance = materialAvoidance;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerRemark() {
        return customerRemark;
    }

    public void setCustomerRemark(String customerRemark) {
        this.customerRemark = customerRemark;
    }

    public String getAdminRemark() {
        return adminRemark;
    }

    public void setAdminRemark(String adminRemark) {
        this.adminRemark = adminRemark;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
