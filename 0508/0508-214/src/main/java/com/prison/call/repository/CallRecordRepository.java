package com.prison.call.repository;

import com.prison.call.entity.CallRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    List<CallRecord> findByInmateId(Long inmateId);
    
    @Query("SELECT COUNT(c) FROM CallRecord c WHERE c.inmateId = :inmateId " +
           "AND c.startTime >= :startDate AND c.startTime < :endDate")
    Integer countByInmateIdAndMonth(@Param("inmateId") Long inmateId,
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);
    
    List<CallRecord> findByHasSensitiveWordTrue();
    
    List<CallRecord> findByPrisonArea(String prisonArea);
    
    @Query("SELECT c.prisonArea, COUNT(c) FROM CallRecord c GROUP BY c.prisonArea")
    List<Object[]> countByPrisonArea();
    
    @Query(value = "SELECT CAST(c.start_time AS DATE) as date, COUNT(*) FROM call_records c " +
           "WHERE c.start_time >= :startDate GROUP BY CAST(c.start_time AS DATE) " +
           "ORDER BY date", nativeQuery = true)
    List<Object[]> countByDate(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT c FROM CallRecord c WHERE c.startTime >= :startDate")
    List<CallRecord> findByStartTimeAfter(@Param("startDate") LocalDateTime startDate);
}
