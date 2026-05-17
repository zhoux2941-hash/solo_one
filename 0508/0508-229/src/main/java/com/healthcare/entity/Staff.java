package com.healthcare.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "staff_info")
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String staffNo;

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

    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String address;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "department", length = 50)
    private String department;

    @Column(name = "position", length = 50)
    private String position;

    @Column(name = "staff_type", length = 20)
    private String staffType;

    @Column(name = "duty_group", length = 50)
    private String dutyGroup;

    @Column(name = "work_status", length = 20)
    private String workStatus;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal salary;

    @Column(length = 500)
    private String skills;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}