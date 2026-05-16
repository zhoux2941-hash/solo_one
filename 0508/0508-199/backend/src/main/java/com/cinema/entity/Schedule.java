package com.cinema.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "schedules")
public class Schedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;
    
    @Column(nullable = false)
    private LocalDateTime showTime;
    
    @Column(nullable = false)
    private String hall;
    
    @Column(nullable = false)
    private Double price;
    
    private Integer totalSeats;
}