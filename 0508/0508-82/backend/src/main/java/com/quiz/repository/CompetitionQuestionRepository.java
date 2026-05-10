package com.quiz.repository;

import com.quiz.entity.CompetitionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionQuestionRepository extends JpaRepository<CompetitionQuestion, Long> {
    List<CompetitionQuestion> findByCompetitionIdOrderByQuestionOrder(Long competitionId);
    CompetitionQuestion findByCompetitionIdAndQuestionOrder(Long competitionId, Integer questionOrder);
}
