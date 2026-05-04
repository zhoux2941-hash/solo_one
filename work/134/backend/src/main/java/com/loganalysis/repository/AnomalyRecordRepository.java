package com.loganalysis.repository;

import com.loganalysis.entity.AnomalyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnomalyRecordRepository extends JpaRepository<AnomalyRecord, Long> {

    Page<AnomalyRecord> findByIsAcknowledgedOrderByAnomalyTimeDesc(Boolean isAcknowledged, Pageable pageable);

    List<AnomalyRecord> findByAnomalyTimeBetweenOrderByAnomalyTimeAsc(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT a FROM AnomalyRecord a WHERE a.anomalyTime BETWEEN :startTime AND :endTime AND (:logType IS NULL OR a.logType = :logType) ORDER BY a.anomalyTime DESC")
    List<AnomalyRecord> findByTimeRangeAndLogType(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("logType") String logType
    );

    @Query("SELECT COUNT(a) FROM AnomalyRecord a WHERE a.anomalyTime BETWEEN :startTime AND :endTime AND a.isAcknowledged = false")
    long countUnacknowledgedByTimeRange(
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT a FROM AnomalyRecord a WHERE a.isAcknowledged = false AND a.createdAt >= :since ORDER BY a.createdAt DESC")
    List<AnomalyRecord> findRecentUnacknowledged(@Param("since") LocalDateTime since);

    @Query("SELECT a FROM AnomalyRecord a WHERE a.anomalyTime = :time AND a.logType = :logType AND a.source = :source")
    List<AnomalyRecord> findExactMatch(
        @Param("time") LocalDateTime time,
        @Param("logType") String logType,
        @Param("source") String source
    );
}
