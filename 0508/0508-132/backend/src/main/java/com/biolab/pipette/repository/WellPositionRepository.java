package com.biolab.pipette.repository;

import com.biolab.pipette.model.WellPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WellPositionRepository extends JpaRepository<WellPosition, Long> {
    List<WellPosition> findByTubeRackIdOrderByRowNumAscColNumAsc(Long tubeRackId);
    
    Optional<WellPosition> findByTubeRackIdAndRowNumAndColNum(Long tubeRackId, Integer rowNum, Integer colNum);
    
    void deleteByTubeRackId(Long tubeRackId);
}