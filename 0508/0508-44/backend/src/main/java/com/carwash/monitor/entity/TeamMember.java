package com.carwash.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "team_member", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"team_id", "employee_id"})
})
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Enumerated(EnumType.STRING)
    private Role role = Role.MEMBER;

    @Column(name = "contribution_points")
    private Integer contributionPoints = 0;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    public enum Role {
        LEADER,
        MEMBER
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
