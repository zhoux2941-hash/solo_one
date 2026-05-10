package com.club.recruitment.repository;

import com.club.recruitment.entity.InterviewSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlot, Long> {
    List<InterviewSlot> findByDepartmentId(Long departmentId);
    Optional<InterviewSlot> findByDepartmentIdAndSlot(Long departmentId, String slot);
    
    @Query("SELECT s FROM InterviewSlot s WHERE s.departmentId = :departmentId AND s.currentCount < s.maxCapacity ORDER BY s.slot")
    List<InterviewSlot> findAvailableSlotsByDepartmentId(Long departmentId);
    
    @Modifying
    @Query("UPDATE InterviewSlot s SET s.currentCount = s.currentCount + 1 WHERE s.id = :slotId AND s.currentCount < s.maxCapacity")
    int incrementCurrentCount(@Param("slotId") Long slotId);
    
    @Modifying
    @Query("UPDATE InterviewSlot s SET s.currentCount = s.currentCount - 1 WHERE s.id = :slotId AND s.currentCount > 0")
    int decrementCurrentCount(@Param("slotId") Long slotId);
}