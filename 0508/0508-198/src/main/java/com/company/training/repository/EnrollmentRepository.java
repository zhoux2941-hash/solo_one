package com.company.training.repository;

import com.company.training.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByCourseIdAndStatus(Long courseId, String status);

    List<Enrollment> findByEmployeeIdOrderByEnrolledAtDesc(Long employeeId);

    Optional<Enrollment> findByCourseIdAndEmployeeId(Long courseId, Long employeeId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.status = 'ENROLLED'")
    Integer countEnrolledByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Enrollment e WHERE e.course.id = :courseId AND e.employee.id = :employeeId AND e.status = :status")
    boolean existsByCourseIdAndEmployeeIdAndStatus(@Param("courseId") Long courseId, @Param("employeeId") Long employeeId, @Param("status") String status);
}
