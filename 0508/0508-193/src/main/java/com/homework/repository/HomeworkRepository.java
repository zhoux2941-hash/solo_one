package com.homework.repository;

import com.homework.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findByTeacherId(Long teacherId);
    List<Homework> findByClassName(String className);
    List<Homework> findByClassNameOrderByCreatedAtDesc(String className);
}
