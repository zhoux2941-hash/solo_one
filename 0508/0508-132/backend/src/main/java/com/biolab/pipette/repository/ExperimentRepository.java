package com.biolab.pipette.repository;

import com.biolab.pipette.model.Experiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperimentRepository extends JpaRepository<Experiment, Long> {
    List<Experiment> findAllByOrderByUpdatedAtDesc();
    
    List<Experiment> findByIsSharedTrueOrderByUpdatedAtDesc();
    
    Optional<Experiment> findByShareCode(String shareCode);
}