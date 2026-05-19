package com.exam.repository;

import com.exam.entity.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, Long> {
}
