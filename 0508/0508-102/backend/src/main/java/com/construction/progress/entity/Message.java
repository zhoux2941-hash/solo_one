package com.construction.progress.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "project_id", nullable = false)
    private Long projectId;
    
    @Column(name = "stage_index")
    private Integer stageIndex;
    
    @Column(name = "stage_name", length = 50)
    private String stageName;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    private Type type = Type.WARNING;
    
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    @Column(name = "related_stage_progress", precision = 5, scale = 2)
    private BigDecimal relatedStageProgress;
    
    @Column(name = "overdue_days")
    private Integer overdueDays;
    
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
    
    public enum Type {
        WARNING, INFO, URGE_REPLY
    }
}
