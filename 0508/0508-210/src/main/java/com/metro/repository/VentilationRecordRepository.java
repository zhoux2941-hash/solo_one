package com.metro.repository;

import com.metro.entity.VentilationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VentilationRecordRepository extends JpaRepository<VentilationRecord, Long> {
    List<VentilationRecord> findBySectionIdOrderByStartTimeDesc(String sectionId);

    @Query("SELECT v FROM VentilationRecord v WHERE v.startTime BETWEEN :startTime AND :endTime ORDER BY v.startTime")
    List<VentilationRecord> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT SUM(v.durationSeconds) FROM VentilationRecord v WHERE v.sectionId = :sectionId AND v.startTime BETWEEN :startTime AND :endTime")
    Long sumDurationBySectionIdAndTimeRange(
            @Param("sectionId") String sectionId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT v.sectionId, SUM(v.durationSeconds) FROM VentilationRecord v WHERE v.startTime BETWEEN :startTime AND :endTime GROUP BY v.sectionId")
    List<Object[]> sumDurationGroupBySectionIdAndTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
