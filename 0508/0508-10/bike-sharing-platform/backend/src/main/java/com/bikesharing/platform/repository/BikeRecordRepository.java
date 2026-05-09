package com.bikesharing.platform.repository;

import com.bikesharing.platform.entity.BikeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BikeRecordRepository extends JpaRepository<BikeRecord, Long> {
    
    @Query("SELECT r FROM BikeRecord r WHERE r.time >= :startTime AND r.time < :endTime ORDER BY r.time")
    List<BikeRecord> findByTimeBetween(@Param("startTime") LocalDateTime startTime, 
                                        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT r FROM BikeRecord r WHERE r.pointId = :pointId AND r.time >= :startTime AND r.time < :endTime ORDER BY r.time")
    List<BikeRecord> findByPointIdAndTimeBetween(@Param("pointId") Long pointId,
                                                   @Param("startTime") LocalDateTime startTime, 
                                                   @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT FUNCTION('HOUR', r.time) as hour, " +
           "SUM(CASE WHEN r.type = 'BORROW' THEN 1 ELSE 0 END) as borrowCount, " +
           "SUM(CASE WHEN r.type = 'RETURN' THEN 1 ELSE 0 END) as returnCount " +
           "FROM BikeRecord r WHERE r.time >= :startTime AND r.time < :endTime " +
           "GROUP BY FUNCTION('HOUR', r.time) ORDER BY hour")
    List<Object[]> getHourlyDemand(@Param("startTime") LocalDateTime startTime, 
                                    @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT FUNCTION('HOUR', r.time) as hour, " +
           "SUM(CASE WHEN r.type = 'BORROW' THEN 1 ELSE 0 END) as borrowCount, " +
           "SUM(CASE WHEN r.type = 'RETURN' THEN 1 ELSE 0 END) as returnCount " +
           "FROM BikeRecord r WHERE r.pointId = :pointId AND r.time >= :startTime AND r.time < :endTime " +
           "GROUP BY FUNCTION('HOUR', r.time) ORDER BY hour")
    List<Object[]> getHourlyDemandByPoint(@Param("pointId") Long pointId,
                                           @Param("startTime") LocalDateTime startTime, 
                                           @Param("endTime") LocalDateTime endTime);
}
