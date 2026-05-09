package com.gym.sanitization.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sanitization_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SanitizationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "sanitization_time", nullable = false)
    private LocalDateTime sanitizationTime;

    @Column(name = "photo_base64", columnDefinition = "LONGTEXT")
    private String photoBase64;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    @Column(name = "inspector_name", length = 100)
    private String inspectorName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (sanitizationTime == null) {
            sanitizationTime = LocalDateTime.now();
        }
    }
}
