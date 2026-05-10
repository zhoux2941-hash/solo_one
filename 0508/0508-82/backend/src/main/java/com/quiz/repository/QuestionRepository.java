package com.quiz.repository;

import com.quiz.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByCategoryId(Long categoryId);

    @Query("SELECT q FROM Question q WHERE q.categoryId IN :categoryIds")
    List<Question> findByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query(value = "SELECT q FROM Question q WHERE q.categoryId IN :categoryIds ORDER BY RAND() LIMIT :limit")
    List<Question> findRandomQuestionsByCategoryIds(@Param("categoryIds") List<Long> categoryIds, @Param("limit") int limit);
}
