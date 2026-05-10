package com.graftingassistant.repository;

import com.graftingassistant.entity.GraftingCompatibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GraftingCompatibilityRepository extends JpaRepository<GraftingCompatibility, Long> {
    
    Optional<GraftingCompatibility> findByRootstockIdAndScionId(Long rootstockId, Long scionId);
}
