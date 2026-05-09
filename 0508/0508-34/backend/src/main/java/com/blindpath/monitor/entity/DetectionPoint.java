package com.blindpath.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "detection_point", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"distance", "record_date"})
})
public class DetectionPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "distance", nullable = false)
    private Integer distance;

    @Column(name = "wear_degree", nullable = false)
    private Integer wearDegree;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;
}
