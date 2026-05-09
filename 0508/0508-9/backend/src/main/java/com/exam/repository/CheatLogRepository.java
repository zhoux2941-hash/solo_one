package com.exam.repository;

import com.exam.entity.CheatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CheatLogRepository extends JpaRepository<CheatLog, Long> {
    
    List<CheatLog> findByExamId(Long examId);
    
    List<CheatLog> findByExamIdAndUserId(Long examId, Long userId);
    
    List<CheatLog> findByExamIdAndTimestampBetween(Long examId, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("SELECT c.questionId, c.actionType, COUNT(c) FROM CheatLog c WHERE c.examId = :examId AND c.userId = :userId GROUP BY c.questionId, c.actionType")
    List<Object[]> getHeatMapDataByExamAndUser(@Param("examId") Long examId, @Param("userId") Long userId);
    
    @Query("SELECT c.actionType, COUNT(c) FROM CheatLog c WHERE c.examId = :examId AND c.userId = :userId GROUP BY c.actionType")
    List<Object[]> getCheatTypeCountByExamAndUser(@Param("examId") Long examId, @Param("userId") Long userId);
    
    @Query("SELECT c.userId, COUNT(c) as cnt FROM CheatLog c WHERE c.examId = :examId GROUP BY c.userId ORDER BY cnt DESC")
    List<Object[]> getTopCheatersByExam(@Param("examId") Long examId);
    
    @Query("SELECT FUNCTION('DATE_FORMAT', c.timestamp, '%Y-%m-%d %H:%i:00') as minute, COUNT(c) FROM CheatLog c WHERE c.examId = :examId GROUP BY minute ORDER BY minute")
    List<Object[]> getTrendDataByExam(@Param("examId") Long examId);
    
    @Query("SELECT COUNT(c) FROM CheatLog c WHERE c.examId = :examId AND c.userId = :userId")
    Long getTotalCheatCountByExamAndUser(@Param("examId") Long examId, @Param("userId") Long userId);
    
    List<CheatLog> findByExamIdOrderByTimestampDesc(Long examId);
}