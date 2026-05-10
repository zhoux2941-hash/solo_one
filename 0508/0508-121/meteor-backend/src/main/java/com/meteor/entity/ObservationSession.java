package com.meteor.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "observation_sessions")
public class ObservationSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String meteorShowerName;

    @Column(nullable = false)
    private String location;

    private Double latitude;

    private Double longitude;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "user_name")
    private String userName;

    private String description;

    @Column(name = "status")
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeteorRecord> meteorRecords = new ArrayList<>();

    @Column(name = "radiant_constellation")
    private String radiantConstellation;

    @Column(name = "radiant_ra")
    private Double radiantRA;

    @Column(name = "radiant_dec")
    private Double radiantDec;

    @Column(name = "cloud_cover")
    private Double cloudCover;

    @Column(name = "limiting_magnitude")
    private Double limitingMagnitude;

    @Column(name = "calculated_zhr")
    private Double calculatedZHR;

    @Column(name = "zhr_confidence")
    private Double zhrConfidence;

    @Column(name = "observed_meteor_count")
    private Integer observedMeteorCount;

    @Column(name = "observation_duration_minutes")
    private Integer observationDurationMinutes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
