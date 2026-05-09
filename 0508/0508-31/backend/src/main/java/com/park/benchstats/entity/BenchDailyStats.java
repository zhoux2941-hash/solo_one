package com.park.benchstats.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "bench_daily_stats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"bench_id", "stat_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenchDailyStats {
    public static final int TOTAL_DAYLIGHT_MINUTES = 12 * 60;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bench_id", nullable = false)
    private Long benchId;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "sun_duration_minutes", nullable = false)
    private Integer sunDurationMinutes;

    @Column(name = "total_daylight_minutes", nullable = false)
    private Integer totalDaylightMinutes = TOTAL_DAYLIGHT_MINUTES;

    @Column(name = "shadow_percentage", nullable = false)
    private Double shadowPercentage;

    @PrePersist
    @PreUpdate
    public void calculateShadowPercentage() {
        if (this.sunDurationMinutes != null && this.totalDaylightMinutes != null 
                && this.totalDaylightMinutes > 0) {
            int sunMin = Math.max(0, Math.min(this.totalDaylightMinutes, this.sunDurationMinutes));
            double shadowPct = ((double) (this.totalDaylightMinutes - sunMin) / this.totalDaylightMinutes) * 100;
            shadowPct = Math.max(0.0, Math.min(100.0, shadowPct));
            this.shadowPercentage = Math.round(shadowPct * 10.0) / 10.0;
        } else if (this.shadowPercentage == null) {
            this.shadowPercentage = 0.0;
        }
    }
}
