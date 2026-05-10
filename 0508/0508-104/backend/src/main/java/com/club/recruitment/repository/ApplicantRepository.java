package com.club.recruitment.repository;

import com.club.recruitment.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    Optional<Applicant> findByStudentId(String studentId);
    List<Applicant> findByAssignedTrue();
    List<Applicant> findByAssignedFalse();
    List<Applicant> findByAssignedDepartmentId(Long departmentId);
    
    @Query("SELECT COUNT(a) FROM Applicant a WHERE a.assignedDepartmentId = :departmentId")
    long countByAssignedDepartmentId(Long departmentId);
    
    @Query("SELECT a FROM Applicant a WHERE a.assignedDepartmentId = :departmentId AND a.assigned = true ORDER BY a.assignedSlot")
    List<Applicant> findAssignedByDepartmentId(Long departmentId);
}