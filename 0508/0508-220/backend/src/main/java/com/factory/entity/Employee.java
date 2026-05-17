package com.factory.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "employee")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String employeeNo;

    @Column(nullable = false, length = 50)
    private String employeeName;

    @Column(length = 20)
    private String idCard;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String address;

    @Column(length = 50)
    private String position;

    private Long teamId;

    @Column(length = 200)
    private String permissions;

    @Column(nullable = false)
    private Integer onDuty = 1;

    @Column(nullable = false)
    private Integer status = 1;

    private LocalDateTime createTime;

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