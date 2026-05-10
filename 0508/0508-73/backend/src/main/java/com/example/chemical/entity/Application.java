package com.example.chemical.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @ManyToOne
    @JoinColumn(name = "chemical_id", nullable = false)
    private Chemical chemical;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String purpose;

    @Column(nullable = false)
    private LocalDate expectedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @ManyToOne
    @JoinColumn(name = "safety_officer_id")
    private User safetyOfficer;

    private LocalDateTime safetyReviewTime;

    private String safetyComment;

    @ManyToOne
    @JoinColumn(name = "director_id")
    private User director;

    private LocalDateTime directorReviewTime;

    private String directorComment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Integer version;

    private LocalDate plannedReturnDate;

    private LocalDateTime actualReturnTime;

    @Column(nullable = false)
    private Boolean isOverdue = false;

    private String overdueReason;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ApplicationStatus {
        PENDING_FIRST_REVIEW,
        PENDING_SECOND_REVIEW,
        FIRST_REVIEW_REJECTED,
        SECOND_REVIEW_REJECTED,
        COMPLETED,
        AUTO_REJECTED,
        RETURNED,
        OVERDUE
    }
}
