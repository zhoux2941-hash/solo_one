package com.skiresort.repository;

import com.skiresort.model.VisitorRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VisitorRecordRepository extends JpaRepository<VisitorRecord, Long> {
    List<VisitorRecord> findBySlopeIdOrderByRecordTimeDesc(Long slopeId);
    
    List<VisitorRecord> findByRecordDateOrderByRecordHour(LocalDate recordDate);
    
    @Query("SELECT v FROM VisitorRecord v WHERE v.slope.id = :slopeId AND v.recordDate = :date ORDER BY v.recordHour")
    List<VisitorRecord> findBySlopeIdAndRecordDate(@Param("slopeId") Long slopeId, @Param("date") LocalDate date);
    
    @Query("SELECT v FROM VisitorRecord v WHERE v.recordDate BETWEEN :startDate AND :endDate ORDER BY v.recordDate, v.recordHour")
    List<VisitorRecord> findByRecordDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
