package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "schedule_swap_requests")
public class ScheduleSwapRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "from_schedule_id", nullable = false)
    private NurseSchedule fromSchedule;

    @ManyToOne
    @JoinColumn(name = "to_schedule_id", nullable = false)
    private NurseSchedule toSchedule;

    @Enumerated(EnumType.STRING)
    private SwapStatus status = SwapStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    private String approvedBy;

    private LocalDateTime approvedAt;

    public enum SwapStatus {
        PENDING, APPROVED, REJECTED
    }
}
