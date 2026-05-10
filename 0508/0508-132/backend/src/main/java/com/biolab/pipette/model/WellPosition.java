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
@Table(name = "well_position", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tube_rack_id", "row_num", "col_num"})
})
public class WellPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tube_rack_id", nullable = false)
    private Long tubeRackId;

    @Column(name = "row_num", nullable = false)
    private Integer rowNum;

    @Column(name = "col_num", nullable = false)
    private Integer colNum;

    @Enumerated(EnumType.STRING)
    @Column(name = "reagent_type", nullable = false)
    private ReagentType reagentType;

    @Column(name = "label")
    private String label;

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