package com.wenwan.bracelet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String realName;

    @Column(unique = true)
    private String phone;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    private CraftsmanStatus craftsmanStatus;

    @Column(columnDefinition = "TEXT")
    private String craftsmanProfile;

    @Column(columnDefinition = "TEXT")
    private String craftsmanSkills;

    private Integer experienceYears;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime approvedAt;

    public enum UserRole {
        CUSTOMER,
        CRAFTSMAN,
        ADMIN
    }

    public enum CraftsmanStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (role == UserRole.CRAFTSMAN && craftsmanStatus == null) {
            craftsmanStatus = CraftsmanStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public CraftsmanStatus getCraftsmanStatus() {
        return craftsmanStatus;
    }

    public void setCraftsmanStatus(CraftsmanStatus craftsmanStatus) {
        this.craftsmanStatus = craftsmanStatus;
    }

    public String getCraftsmanProfile() {
        return craftsmanProfile;
    }

    public void setCraftsmanProfile(String craftsmanProfile) {
        this.craftsmanProfile = craftsmanProfile;
    }

    public String getCraftsmanSkills() {
        return craftsmanSkills;
    }

    public void setCraftsmanSkills(String craftsmanSkills) {
        this.craftsmanSkills = craftsmanSkills;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
}