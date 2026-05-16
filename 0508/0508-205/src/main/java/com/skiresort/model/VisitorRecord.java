package com.skiresort.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "visitor_records")
public class VisitorRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slope_id")
    private Slope slope;

    @Column(nullable = false)
    private Integer visitorCount;

    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(name = "record_hour")
    private Integer recordHour;

    @Column(name = "record_time")
    private LocalDateTime recordTime;
}
