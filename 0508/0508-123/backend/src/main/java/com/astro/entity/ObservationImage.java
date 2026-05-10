package com.astro.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "observation_images")
public class ObservationImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(name = "raw_image_path", nullable = false)
    private String rawImagePath;

    @Column(name = "flat_image_path", nullable = false)
    private String flatImagePath;

    @Column(name = "calibrated_image_path", nullable = false)
    private String calibratedImagePath;

    @Column(name = "avg_sky_brightness", nullable = false)
    private Double avgSkyBrightness;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
