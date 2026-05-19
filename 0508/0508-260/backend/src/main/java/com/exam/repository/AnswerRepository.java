package com.exam.repository;

import com.exam.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByExamRecordId(Long examRecordId);
    Optional<Answer> findByExamRecordIdAndQuestionId(Long examRecordId, Long questionId);
}
