package com.exam.repository;

import com.exam.entity.ExamRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRecordRepository extends JpaRepository<ExamRecord, Long> {
    List<ExamRecord> findByUserId(Long userId);
    List<ExamRecord> findByExamSessionId(Long examSessionId);
    Optional<ExamRecord> findByUserIdAndExamSessionId(Long userId, Long examSessionId);
}
