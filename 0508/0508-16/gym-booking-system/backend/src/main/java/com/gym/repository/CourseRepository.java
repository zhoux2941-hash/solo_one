package com.gym.repository;

import com.gym.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime startTime);
    
    List<Course> findByCoachId(Long coachId);
    
    @Query("SELECT c FROM Course c WHERE c.startTime BETWEEN :start AND :end ORDER BY c.startTime")
    List<Course> findCoursesBetweenDates(@Param("start") LocalDateTime start, 
                                          @Param("end") LocalDateTime end);
}
