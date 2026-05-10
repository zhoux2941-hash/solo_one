package com.biolab.pipette.repository;

import com.biolab.pipette.model.PipetteTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipetteTaskRepository extends JpaRepository<PipetteTask, Long> {
    List<PipetteTask> findByExperimentIdOrderByTaskOrderAsc(Long experimentId);
    
    void deleteByExperimentId(Long experimentId);
}