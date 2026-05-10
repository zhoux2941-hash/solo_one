package com.biolab.pipette.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pipette_task")
public class PipetteTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experiment_id", nullable = false)
    private Long experimentId;

    @Column(name = "source_well_id", nullable = false)
    private Long sourceWellId;

    @Column(name = "target_well_id", nullable = false)
    private Long targetWellId;

    @Column(name = "volume_ul")
    private Double volumeUl;

    @Column(name = "task_order")
    private Integer taskOrder;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}