package com.exam.repository;

import com.exam.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByCategory(String category);
    List<Question> findByType(Question.QuestionType type);
}
