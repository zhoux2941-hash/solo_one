package com.lightpollution.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "challenge_log", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"challenge_id", "log_date"})
})
public class ChallengeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "observation_id", nullable = false)
    private Long observationId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
