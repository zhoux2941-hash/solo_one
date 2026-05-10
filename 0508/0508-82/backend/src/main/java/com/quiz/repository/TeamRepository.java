package com.quiz.repository;

import com.quiz.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByCompetitionIdOrderByScoreDesc(Long competitionId);
    List<Team> findByCompetitionId(Long competitionId);
}
