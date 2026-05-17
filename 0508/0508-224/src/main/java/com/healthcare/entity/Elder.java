package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "elder_info")
public class Elder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String elderNo;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 20)
    private String idCard;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "bed_id")
    private Long bedId;

    @Column(name = "caregiver_id")
    private Long caregiverId;

    @Column(name = "checkin_date")
    private LocalDate checkinDate;

    @Column(name = "checkout_date")
    private LocalDate checkoutDate;

    @Column(name = "living_status", length = 20)
    private String livingStatus;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "blood_type", length = 10)
    private String bloodType;

    @Column(length = 1000)
    private String allergies;

    @Column(name = "chronic_diseases", length = 1000)
    private String chronicDiseases;

    @Column(length = 1000)
    private String medications;

    @Column(name = "medical_history", length = 2000)
    private String medicalHistory;

    @Column(name = "health_status", length = 50)
    private String healthStatus;

    @Column(name = "emergency_contact_name", length = 50)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relation", length = 20)
    private String emergencyContactRelation;

    @Column(length = 500)
    private String remark;

    @Column(nullable = false)
    private Integer status = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (checkinDate == null && "在住".equals(livingStatus)) {
            checkinDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
