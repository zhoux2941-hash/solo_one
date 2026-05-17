package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "checkin_application")
public class CheckInApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String applicationNo;

    @Column(name = "elder_id")
    private Long elderId;

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

    @Column(name = "expected_checkin_date")
    private LocalDate expectedCheckinDate;

    @Column(name = "health_status", length = 50)
    private String healthStatus;

    @Column(name = "medical_history", length = 2000)
    private String medicalHistory;

    @Column(name = "chronic_diseases", length = 1000)
    private String chronicDiseases;

    @Column(name = "disability_status", length = 100)
    private String disabilityStatus;

    @Column(name = "emergency_contact_name", length = 50)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_relation", length = 20)
    private String emergencyContactRelation;

    @Column(name = "application_status", length = 20)
    private String applicationStatus;

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @Column(name = "review_opinion", length = 500)
    private String reviewOpinion;

    @Column(name = "assigned_bed_id")
    private Long assignedBedId;

    @Column(name = "assigned_caregiver_id")
    private Long assignedCaregiverId;

    @Column(name = "checkin_completed")
    private Boolean checkinCompleted = false;

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
        if (applicationStatus == null) {
            applicationStatus = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
