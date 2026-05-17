package com.military.training.repository;

import com.military.training.entity.ScoreRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRecordRepository extends JpaRepository<ScoreRecord, Long> {
    List<ScoreRecord> findByTraineeId(Long traineeId);
    List<ScoreRecord> findBySubjectId(Long subjectId);
    Optional<ScoreRecord> findByTraineeIdAndSubjectId(Long traineeId, Long subjectId);
    void deleteByTraineeId(Long traineeId);
}