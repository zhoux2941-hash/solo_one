package com.pool.repository;

import com.pool.entity.LaneTolerance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LaneToleranceRepository extends JpaRepository<LaneTolerance, Long> {
    List<LaneTolerance> findByZoneOrderByIdAsc(String zone);

    List<LaneTolerance> findByRecordDateOrderByIdAsc(LocalDate recordDate);

    @Query("SELECT lt FROM LaneTolerance lt WHERE lt.recordDate = :date ORDER BY " +
           "CASE lt.zone WHEN 'shallower' THEN 0 WHEN 'deeper' THEN 1 ELSE 2 END, lt.id ASC")
    List<LaneTolerance> findByRecordDateOrderedByZone(@Param("date") LocalDate date);

    @Query("SELECT lt.recordDate, AVG(lt.toleranceValue) FROM LaneTolerance lt " +
           "WHERE lt.recordDate BETWEEN :startDate AND :endDate " +
           "GROUP BY lt.recordDate ORDER BY lt.recordDate ASC")
    List<Object[]> findAverageByDateRange(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);
}
