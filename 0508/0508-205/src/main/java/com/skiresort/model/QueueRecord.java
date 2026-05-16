package com.skiresort.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "queue_records")
public class QueueRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lift_id", nullable = false)
    private Lift lift;

    @Column(nullable = false)
    private Integer queueSize;

    @Column(nullable = false)
    private Integer waitTimeMinutes;

    @Column(name = "record_time")
    private LocalDateTime recordTime;

    private String recordedBy;
}
