package com.playground.simulator.repository;

import com.playground.simulator.entity.SimulationSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SimulationSummaryRepository extends JpaRepository<SimulationSummary, Long> {
    Optional<SimulationSummary> findBySimulationId(String simulationId);
    List<SimulationSummary> findAllByOrderBySimulationTimeDesc();
}
