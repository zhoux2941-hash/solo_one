package com.cinema.entity;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "seats")
public class Seat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;
    
    @Column(nullable = false)
    private String rowCode;
    
    @Column(nullable = false)
    private Integer colNum;
    
    @Enumerated(EnumType.STRING)
    private SeatStatus status;
    
    private Long lockedBy;
    
    private java.time.LocalDateTime lockedUntil;
    
    public enum SeatStatus {
        AVAILABLE, OCCUPIED, LOCKED
    }
}