package com.graftingassistant.repository;

import com.graftingassistant.entity.CompatibilityScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompatibilityScoreRepository extends JpaRepository<CompatibilityScore, Long> {
    
    Optional<CompatibilityScore> findByRootstockIdAndScionId(Long rootstockId, Long scionId);
}
