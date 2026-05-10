package com.tide.repository;

import com.tide.model.TideRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TideRecordRepository extends JpaRepository<TideRecord, Long> {
    
    @Query("SELECT t FROM TideRecord t WHERE t.location.id = :locationId AND t.recordTime BETWEEN :start AND :end ORDER BY t.recordTime")
    List<TideRecord> findByLocationIdAndTimeRange(
            @Param("locationId") Long locationId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT t FROM TideRecord t WHERE t.location.id = :locationId AND FUNCTION('DATE', t.recordTime) = FUNCTION('DATE', :date) ORDER BY t.recordTime")
    List<TideRecord> findByLocationIdAndDate(
            @Param("locationId") Long locationId,
            @Param("date") LocalDateTime date
    );

    List<TideRecord> findByLocationIdOrderByRecordTimeDesc(Long locationId);
}
