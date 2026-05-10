package com.graftingassistant.repository;

import com.graftingassistant.entity.PhenologyStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhenologyStageRepository extends JpaRepository<PhenologyStage, Long> {
    
    List<PhenologyStage> findAllByOrderByStageOrderAsc();
}
