package com.pumpstation.repository;

import com.pumpstation.entity.PumpStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PumpStationRepository extends JpaRepository<PumpStation, Long> {
    Optional<PumpStation> findByPumpNo(String pumpNo);
    boolean existsByPumpNo(String pumpNo);
}
