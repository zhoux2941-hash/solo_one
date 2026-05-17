package com.psychiatric.repository;

import com.psychiatric.entity.LocationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocationRecordRepository extends JpaRepository<LocationRecord, Long> {
    List<LocationRecord> findByBraceletIdOrderByRecordTimeDesc(String braceletId);
    
    @Query("SELECT COUNT(l) FROM LocationRecord l WHERE l.braceletId = :braceletId " +
           "AND l.location = '走廊' AND l.isNightTime = true " +
           "AND l.recordTime BETWEEN :startTime AND :endTime")
    long countNightCorridorActivity(@Param("braceletId") String braceletId,
                                    @Param("startTime") LocalDateTime startTime,
                                    @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT DISTINCT l.braceletId FROM LocationRecord l WHERE l.isNightTime = true")
    List<String> findAllBraceletIdsWithNightActivity();
}
