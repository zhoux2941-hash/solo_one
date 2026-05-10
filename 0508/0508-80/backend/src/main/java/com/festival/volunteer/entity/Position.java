package com.festival.volunteer.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "positions")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PositionType type;

    @Column(name = "required_count", nullable = false)
    private Integer requiredCount;

    @Column(name = "current_count", nullable = false)
    private Integer currentCount = 0;

    @Column
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PositionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (currentCount == null) {
            currentCount = 0;
        }
        if (status == null) {
            status = PositionStatus.ACTIVE;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PositionType {
        TICKET_CHECKING("检票"),
        GUIDE("引导"),
        STAGE_ASSIST("舞台协助"),
        LOGISTICS("后勤"),
        SECURITY("安保"),
        FIRST_AID("急救"),
        OTHER("其他");

        private final String displayName;

        PositionType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum PositionStatus {
        ACTIVE,
        FULL,
        INACTIVE
    }
}
