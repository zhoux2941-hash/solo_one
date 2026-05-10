package com.meteor.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "meteor_records")
public class MeteorRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ObservationSession session;

    @Column(name = "constellation", nullable = false)
    private String constellation;

    @Column(name = "brightness")
    private Double brightness;

    @Column(name = "color")
    private String color;

    @Column(name = "trajectory_start_ra")
    private Double trajectoryStartRA;

    @Column(name = "trajectory_start_dec")
    private Double trajectoryStartDec;

    @Column(name = "trajectory_end_ra")
    private Double trajectoryEndRA;

    @Column(name = "trajectory_end_dec")
    private Double trajectoryEndDec;

    @Column(name = "observed_time")
    private LocalDateTime observedTime;

    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (observedTime == null) {
            observedTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
