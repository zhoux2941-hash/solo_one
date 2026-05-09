package com.carwash.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "foam_concentration", indexes = {
    @Index(name = "idx_machine_time", columnList = "machineId, recordTime"),
    @Index(name = "idx_record_time", columnList = "recordTime")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoamConcentration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String machineId;

    @Column(nullable = false)
    private Double concentration;

    @Column(nullable = false)
    private LocalDateTime recordTime;

    @Transient
    private boolean abnormal;
}
