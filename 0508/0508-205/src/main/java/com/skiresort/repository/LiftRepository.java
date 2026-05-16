package com.skiresort.repository;

import com.skiresort.model.Lift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiftRepository extends JpaRepository<Lift, Long> {
    List<Lift> findByIsActiveTrue();
    List<Lift> findByType(Lift.LiftType type);
}
