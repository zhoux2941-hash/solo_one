package com.quiz.repository;

import com.quiz.entity.Competition;
import com.quiz.entity.CompetitionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, Long> {
    List<Competition> findByStatus(CompetitionStatus status);
}
