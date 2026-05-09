package com.company.seatbooking.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "booking", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"seat_id", "date", "time_slot"})
})
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;
    
    @Column(name = "seat_id", insertable = false, updatable = false)
    private Long seatId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", nullable = false, length = 20)
    private TimeSlot timeSlot;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BookingStatus status = BookingStatus.CONFIRMED;
    
    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;
    
    @Column(name = "is_auto_released")
    private Boolean isAutoReleased = false;
    
    @Column(name = "released_at")
    private LocalDateTime releasedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDate createdAt = LocalDate.now();
    
    public enum TimeSlot {
        MORNING,
        AFTERNOON,
        FULL_DAY
    }
    
    public enum BookingStatus {
        CONFIRMED,
        CHECKED_IN,
        AUTO_RELEASED,
        CANCELLED
    }
    
    public boolean isCheckedIn() {
        return checkInTime != null || BookingStatus.CHECKED_IN.equals(status);
    }
    
    public boolean canCheckIn() {
        return BookingStatus.CONFIRMED.equals(status);
    }
}
