package com.office.plantreminder.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "watering_logs")
public class WateringLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plant_id", nullable = false)
    private Long plantId;

    @Column(name = "watered_by", nullable = false, length = 100)
    private String wateredBy;

    @Column(name = "watered_at", nullable = false)
    private LocalDateTime wateredAt;

    @Column(length = 255)
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (wateredAt == null) {
            wateredAt = LocalDateTime.now();
        }
    }
}
