package com.hospital.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "nurse_schedules")
public class NurseSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "nurse_id", nullable = false)
    private Nurse nurse;

    @Column(nullable = false)
    private LocalDate scheduleDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftType shift;

    @Enumerated(EnumType.STRING)
    private ScheduleStatus status = ScheduleStatus.CONFIRMED;

    public enum ShiftType {
        MORNING, AFTERNOON, NIGHT
    }

    public enum ScheduleStatus {
        CONFIRMED, PENDING_APPROVAL, APPROVED, REJECTED
    }
}
