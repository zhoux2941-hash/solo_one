package com.construction.progress.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "project_stages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "stage_index"})
})
public class ProjectStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    
    @Column(name = "stage_index", nullable = false)
    private Integer stageIndex;
    
    @Column(name = "stage_name", nullable = false, length = 50)
    private String stageName;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal progress = BigDecimal.ZERO;
    
    @Column(name = "is_completed")
    private Boolean isCompleted = false;
    
    @Column(name = "completed_time")
    private LocalDateTime completedTime;
    
    @Column(name = "planned_days")
    private Integer plannedDays = 0;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "last_warning_time")
    private LocalDateTime lastWarningTime;
    
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
