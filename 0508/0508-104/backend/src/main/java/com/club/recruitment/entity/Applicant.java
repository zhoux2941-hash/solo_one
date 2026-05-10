package com.club.recruitment.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "applicants")
public class Applicant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String studentId;

    @Column(nullable = false, length = 1000)
    private String preferredDepartments;

    @Column(nullable = false)
    private Boolean acceptAdjustment;

    @Column(nullable = false, length = 1000)
    private String freeSlots;

    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean assigned = false;

    private Long assignedDepartmentId;

    private String assignedDepartmentName;

    private String assignedSlot;

    private Integer priority;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}