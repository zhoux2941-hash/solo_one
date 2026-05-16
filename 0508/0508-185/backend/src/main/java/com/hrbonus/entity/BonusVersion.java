package com.hrbonus.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bonus_versions")
public class BonusVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bonus_pool_id", nullable = false)
    private Long bonusPoolId;

    @Column(name = "allocation_id")
    private Long allocationId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "change_reason")
    private String changeReason;

    @Column(name = "changed_by")
    private Long changedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
