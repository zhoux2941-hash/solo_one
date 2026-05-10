package com.charging.repository;

import com.charging.entity.ChargingPile;
import com.charging.entity.PileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargingPileRepository extends JpaRepository<ChargingPile, Long> {
    Optional<ChargingPile> findByPileCode(String pileCode);
    List<ChargingPile> findByStatus(PileStatus status);
    List<ChargingPile> findByLocation(String location);
    boolean existsByPileCode(String pileCode);
}
