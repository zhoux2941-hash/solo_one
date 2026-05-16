package com.company.training.repository;

import com.company.training.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByStatusOrderByCreatedAtDesc(String status);

    List<Course> findByTypeAndStatus(String type, String status);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.startTime ASC")
    List<Course> findAllPublishedCourses();
}
