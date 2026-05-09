package com.carwash.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "checkin_record", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "checkin_date"})
})
public class CheckinRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Column(name = "is_success")
    private Boolean isSuccess = false;

    @Column(name = "points_earned")
    private Integer pointsEarned = 0;

    @Column(name = "plate_probability")
    private Double plateProbability = 0.0;

    @Column(name = "consecutive_days")
    private Integer consecutiveDays = 0;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
