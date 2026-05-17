package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "health_record")
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_no", unique = true, nullable = false, length = 50)
    private String recordNo;

    @Column(name = "elder_id", nullable = false)
    private Long elderId;

    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "blood_pressure_systolic")
    private Integer bloodPressureSystolic;

    @Column(name = "blood_pressure_diastolic")
    private Integer bloodPressureDiastolic;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "blood_sugar", precision = 5, scale = 2)
    private BigDecimal bloodSugar;

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

    @Column(name = "family_history", length = 1000)
    private String familyHistory;

    @Column(name = "health_assessment", length = 2000)
    private String healthAssessment;

    @Column(name = "nursing_needs", length = 1000)
    private String nursingNeeds;

    @Column(name = "nursing_level", length = 20)
    private String nursingLevel;

    @Column(name = "dietary_requirements", length = 500)
    private String dietaryRequirements;

    @Column(name = "exercise_habits", length = 500)
    private String exerciseHabits;

    @Column(name = "sleep_quality", length = 50)
    private String sleepQuality;

    @Column(name = "mental_status", length = 50)
    private String mentalStatus;

    @Column(name = "cognitive_function", length = 50)
    private String cognitiveFunction;

    @Column(name = "adl_score")
    private Integer adlScore;

    @Column(name = "recorded_by_id")
    private Long recordedById;

    @Column(name = "recorded_by_name", length = 50)
    private String recordedByName;

    @Column(length = 1000)
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
        if (recordDate == null) {
            recordDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
