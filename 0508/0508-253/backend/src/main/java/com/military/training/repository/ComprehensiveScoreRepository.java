package com.military.training.repository;

import com.military.training.entity.ComprehensiveScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComprehensiveScoreRepository extends JpaRepository<ComprehensiveScore, Long> {
    Optional<ComprehensiveScore> findByTraineeId(Long traineeId);
    List<ComprehensiveScore> findAllByOrderByRankAsc();
}