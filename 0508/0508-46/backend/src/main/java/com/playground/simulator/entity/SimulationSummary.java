package com.playground.simulator.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "simulation_summary")
public class SimulationSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String simulationId;

    @Column(nullable = false)
    private int totalChildren;

    @Column(nullable = false)
    private int patienceCoefficient;

    @Column(nullable = false)
    private int slideUsageTime;

    @Column(nullable = false)
    private int totalSimulationTime;

    @Column(nullable = false)
    private int childrenWhoLeftEarly;

    @Column(nullable = false)
    private int totalPlays;

    @Column(nullable = false)
    private int averageWaitTime;

    @Column(nullable = false)
    private LocalDateTime simulationTime;
}
