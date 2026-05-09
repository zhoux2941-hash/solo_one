package com.exam.repository;

import com.exam.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByExamIdOrderByQuestionOrder(Long examId);
    List<Question> findByExamId(Long examId);
}