package com.metro.repository;

import com.metro.entity.DustSensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DustSensorDataRepository extends JpaRepository<DustSensorData, Long> {
    List<DustSensorData> findBySectionIdOrderByReportTimeDesc(String sectionId);

    @Query("SELECT d FROM DustSensorData d WHERE d.sectionId = :sectionId AND d.reportTime BETWEEN :startTime AND :endTime ORDER BY d.reportTime")
    List<DustSensorData> findBySectionIdAndTimeRange(
            @Param("sectionId") String sectionId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT d FROM DustSensorData d WHERE d.reportTime BETWEEN :startTime AND :endTime ORDER BY d.reportTime")
    List<DustSensorData> findByTimeRange(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<DustSensorData> findTop10ByOrderByReportTimeDesc();
}
