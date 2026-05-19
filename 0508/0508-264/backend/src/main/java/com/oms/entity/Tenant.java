package com.oms.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tenants")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tenantCode;

    @Column(nullable = false)
    private String tenantName;

    private String contactPerson;

    private String contactPhone;

    private String email;

    private String address;

    @Enumerated(EnumType.STRING)
    private TenantStatus status = TenantStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum TenantStatus {
        ACTIVE, INACTIVE, SUSPENDED
    }
}
