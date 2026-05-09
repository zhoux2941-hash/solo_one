package com.blindpath.monitor.repository;

import com.blindpath.monitor.entity.DetectionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DetectionPointRepository extends JpaRepository<DetectionPoint, Long> {

    List<DetectionPoint> findByRecordDateOrderByDistanceAsc(LocalDate recordDate);

    Optional<DetectionPoint> findByDistanceAndRecordDate(Integer distance, LocalDate recordDate);

    boolean existsByRecordDate(LocalDate recordDate);

    @Query("SELECT dp FROM DetectionPoint dp WHERE dp.recordDate BETWEEN :startDate AND :endDate ORDER BY dp.distance ASC, dp.recordDate ASC")
    List<DetectionPoint> findByRecordDateBetweenOrderByDistanceAscRecordDateAsc(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT dp.distance FROM DetectionPoint dp ORDER BY dp.distance ASC")
    List<Integer> findDistinctDistances();
}
