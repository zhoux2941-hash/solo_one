package com.sales.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "公司名称不能为空")
    @Size(min = 2, max = 100, message = "公司名称长度必须在2-100个字符之间")
    private String companyName;

    @NotBlank(message = "联系人不能为空")
    @Size(min = 2, max = 50, message = "联系人姓名长度必须在2-50个字符之间")
    private String contactPerson;

    @NotBlank(message = "电话不能为空")
    @Size(min = 7, max = 20, message = "电话号码长度必须在7-20个字符之间")
    @Pattern(regexp = "^[0-9+\\-\\s()]+$", message = "电话号码只能包含数字、空格、+、-、(、)")
    private String phone;

    @Enumerated(EnumType.STRING)
    private CustomerLevel level;

    @Size(max = 50, message = "销售人员姓名长度不能超过50个字符")
    private String salesperson;

    private Integer dealProbability = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FollowUpRecord> followUpRecords = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum CustomerLevel {
        A, B, C
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public CustomerLevel getLevel() {
        return level;
    }

    public void setLevel(CustomerLevel level) {
        this.level = level;
    }

    public String getSalesperson() {
        return salesperson;
    }

    public void setSalesperson(String salesperson) {
        this.salesperson = salesperson;
    }

    public Integer getDealProbability() {
        return dealProbability;
    }

    public void setDealProbability(Integer dealProbability) {
        this.dealProbability = dealProbability;
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

    public List<FollowUpRecord> getFollowUpRecords() {
        return followUpRecords;
    }

    public void setFollowUpRecords(List<FollowUpRecord> followUpRecords) {
        this.followUpRecords = followUpRecords;
    }
}