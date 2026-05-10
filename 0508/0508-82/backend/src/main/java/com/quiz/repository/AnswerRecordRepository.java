package com.quiz.repository;

import com.quiz.entity.AnswerRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRecordRepository extends JpaRepository<AnswerRecord, Long> {
    List<AnswerRecord> findByCompetitionId(Long competitionId);
    List<AnswerRecord> findByCompetitionIdAndTeamId(Long competitionId, Long teamId);
}
