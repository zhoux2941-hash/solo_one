package com.cinema.popcorn.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "passenger_flow_history")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerFlowHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "hour_of_day", nullable = false)
    private Integer hourOfDay;

    @Column(name = "passenger_count", nullable = false)
    private Integer passengerCount;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "is_holiday")
    private Boolean isHoliday;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dayOfWeek == null && recordDate != null) {
            dayOfWeek = recordDate.getDayOfWeek().getValue();
        }
    }
}
