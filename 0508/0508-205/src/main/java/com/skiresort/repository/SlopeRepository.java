package com.skiresort.repository;

import com.skiresort.model.Slope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SlopeRepository extends JpaRepository<Slope, Long> {
    List<Slope> findByStatus(Slope.SlopeStatus status);
    List<Slope> findByDifficulty(Slope.DifficultyLevel difficulty);
}
