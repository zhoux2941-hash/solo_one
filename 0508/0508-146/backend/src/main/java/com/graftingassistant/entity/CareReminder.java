package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "care_reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CareReminder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private PhenologyStage stage;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderType type;
    
    @Column(nullable = false, length = 100)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "days_offset")
    private Integer daysOffset = 0;
    
    @Column(name = "is_repeatable")
    private Boolean isRepeatable = false;
    
    @Column(name = "repeat_interval_days")
    private Integer repeatIntervalDays;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderPriority priority = ReminderPriority.MEDIUM;
    
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
    
    public enum ReminderType {
        WATERING, UNBANDING, FERTILIZING, PRUNING, PEST_CONTROL, OTHER
    }
    
    public enum ReminderPriority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
