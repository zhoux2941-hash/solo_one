package com.military.training.repository;

import com.military.training.entity.TrainingSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingSubjectRepository extends JpaRepository<TrainingSubject, Long> {
    List<TrainingSubject> findByCategory(String category);
    boolean existsByName(String name);
}