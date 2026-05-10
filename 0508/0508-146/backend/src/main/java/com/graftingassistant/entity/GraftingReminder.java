package com.graftingassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "grafting_reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraftingReminder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private GraftingRecord graftingRecord;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reminder_id", nullable = false)
    private CareReminder careReminder;
    
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;
    
    @Column(name = "is_completed")
    private Boolean isCompleted = false;
    
    @Column(name = "completed_date")
    private LocalDate completedDate;
    
    @Column(name = "is_dismissed")
    private Boolean isDismissed = false;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
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
