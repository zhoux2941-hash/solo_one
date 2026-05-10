package com.battery.repository;

import com.battery.entity.SimulationLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SimulationLogRepository extends JpaRepository<SimulationLog, Long> {
    List<SimulationLog> findTop50ByOrderByCreatedAtDesc();
}