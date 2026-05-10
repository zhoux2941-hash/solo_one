package com.charging.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fault_reports")
public class FaultReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pile_id", nullable = false)
    private Long pileId;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FaultReportStatus status = FaultReportStatus.PENDING;

    @Column(name = "handler_id")
    private Long handlerId;

    @Column(name = "handle_note", columnDefinition = "TEXT")
    private String handleNote;

    @Column(name = "reported_at")
    private LocalDateTime reportedAt;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pile_id", insertable = false, updatable = false)
    private ChargingPile pile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id", insertable = false, updatable = false)
    private User reporter;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
