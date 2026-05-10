package com.biolab.pipette.repository;

import com.biolab.pipette.model.TubeRack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TubeRackRepository extends JpaRepository<TubeRack, Long> {
    List<TubeRack> findAllByOrderByUpdatedAtDesc();
}