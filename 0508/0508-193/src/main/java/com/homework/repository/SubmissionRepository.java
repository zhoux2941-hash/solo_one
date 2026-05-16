package com.homework.repository;

import com.homework.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByHomeworkId(Long homeworkId);
    List<Submission> findByStudentId(Long studentId);
    Optional<Submission> findByHomeworkIdAndStudentId(Long homeworkId, Long studentId);
    List<Submission> findByHomeworkIdAndStatus(Long homeworkId, Submission.Status status);
    
    @Query("SELECT s FROM Submission s WHERE s.homework.className = :className AND s.status = 'GRADED'")
    List<Submission> findGradedByClassName(String className);
    
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.homework.id = :homeworkId AND s.score >= :score")
    Long countByHomeworkIdAndScoreGreaterThanEqual(Long homeworkId, Integer score);
    
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.homework.id = :homeworkId AND s.score < :score")
    Long countByHomeworkIdAndScoreLessThan(Long homeworkId, Integer score);
    
    Long countByHomeworkIdAndScoreBetween(Long homeworkId, Integer minScore, Integer maxScore);
}
