package com.gym.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "booking", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "user_name", nullable = false, length = 50)
    private String userName;
    
    @Column(name = "course_id", nullable = false)
    private Long courseId;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BookingStatus status;
    
    @Column(name = "book_time", nullable = false)
    private LocalDateTime bookTime;
    
    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;
    
    @Column(name = "create_time")
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (status == null) {
            status = BookingStatus.BOOKED;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
    
    public enum BookingStatus {
        BOOKED,     
        CHECKED_IN, 
        NO_SHOW     
    }
}
