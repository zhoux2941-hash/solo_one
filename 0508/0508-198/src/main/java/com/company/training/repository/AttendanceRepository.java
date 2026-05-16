package com.company.training.repository;

import com.company.training.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByCourseId(Long courseId);

    List<Attendance> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    Optional<Attendance> findByCourseIdAndEmployeeId(Long courseId, Long employeeId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.course.id = :courseId AND a.signedIn = true")
    Integer countSignedInByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Attendance a WHERE a.course.id = :courseId AND a.employee.id = :employeeId AND a.signedIn = :signedIn")
    boolean existsByCourseIdAndEmployeeIdAndSignedIn(@Param("courseId") Long courseId, @Param("employeeId") Long employeeId, @Param("signedIn") Boolean signedIn);
}
