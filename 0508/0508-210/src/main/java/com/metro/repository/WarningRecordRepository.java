package com.metro.repository;

import com.metro.entity.WarningRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WarningRecordRepository extends JpaRepository<WarningRecord, Long> {
    List<WarningRecord> findBySectionIdOrderByWarningTimeDesc(String sectionId);

    List<WarningRecord> findByResolvedOrderByWarningTimeDesc(Boolean resolved);

    List<WarningRecord> findBySectionIdAndResolved(String sectionId, Boolean resolved);

    @Query("SELECT w FROM WarningRecord w WHERE w.sectionId = :sectionId AND w.resolved = false AND w.warningType = :warningType")
    List<WarningRecord> findActiveWarningsBySectionIdAndType(
            @Param("sectionId") String sectionId,
            @Param("warningType") String warningType
    );

    @Query("SELECT w FROM WarningRecord w WHERE w.warningTime BETWEEN :startTime AND :endTime ORDER BY w.warningTime")
    List<WarningRecord> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<WarningRecord> findTop10ByOrderByWarningTimeDesc();
}
