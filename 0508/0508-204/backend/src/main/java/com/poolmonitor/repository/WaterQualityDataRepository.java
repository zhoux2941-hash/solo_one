package com.poolmonitor.repository;

import com.poolmonitor.entity.WaterQualityData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WaterQualityDataRepository extends JpaRepository<WaterQualityData, Long> {

    List<WaterQualityData> findByRecordTimeBetweenOrderByRecordTimeDesc(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT w FROM WaterQualityData w WHERE w.recordTime >= :startTime ORDER BY w.recordTime DESC")
    List<WaterQualityData> findRecentData(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(w) FROM WaterQualityData w WHERE w.standard = true AND w.recordTime BETWEEN :startTime AND :endTime")
    Long countStandardData(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(w) FROM WaterQualityData w WHERE w.recordTime BETWEEN :startTime AND :endTime")
    Long countTotalData(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    List<WaterQualityData> findTop24ByOrderByRecordTimeDesc();
}