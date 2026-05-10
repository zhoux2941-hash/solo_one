package com.swimming.lanematcher.repository;

import com.swimming.lanematcher.entity.LaneWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LaneWeightRepository extends JpaRepository<LaneWeight, Long> {
    
    Optional<LaneWeight> findByLaneId(Integer laneId);
    
    List<LaneWeight> findAllByOrderByLaneIdAsc();
    
    @Query("SELECT w FROM LaneWeight w ORDER BY w.totalWeight DESC")
    List<LaneWeight> findAllOrderByTotalWeightDesc();
    
    @Query("SELECT w.laneId, w.totalWeight FROM LaneWeight w")
    List<Object[]> getLaneWeights();
}