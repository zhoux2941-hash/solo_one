package com.hrbonus.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bonus_reports")
public class BonusReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "quarter_year", nullable = false)
    private Integer quarterYear;

    @Column(name = "quarter_number", nullable = false)
    private Integer quarterNumber;

    @Column(name = "total_bonus", precision = 19, scale = 2)
    private BigDecimal totalBonus;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "avg_bonus", precision = 19, scale = 2)
    private BigDecimal avgBonus;

    @Column(name = "report_data", columnDefinition = "TEXT")
    private String reportData;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}
