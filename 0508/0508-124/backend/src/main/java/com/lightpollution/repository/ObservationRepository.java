package com.lightpollution.repository;

import com.lightpollution.entity.Observation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ObservationRepository extends JpaRepository<Observation, Long> {
    
    List<Observation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT o FROM Observation o WHERE o.latitude BETWEEN :minLat AND :maxLat AND o.longitude BETWEEN :minLng AND :maxLng")
    List<Observation> findByBoundingBox(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    @Query("SELECT o FROM Observation o WHERE o.userId = :userId AND o.latitude = :lat AND o.longitude = :lng AND o.createdAt >= :startDate")
    List<Observation> findByUserIdAndLocationAfterDate(
        @Param("userId") Long userId,
        @Param("lat") BigDecimal lat,
        @Param("lng") BigDecimal lng,
        @Param("startDate") LocalDateTime startDate
    );
    
    @Query("SELECT AVG(o.magnitude) FROM Observation o WHERE o.latitude BETWEEN :minLat AND :maxLat AND o.longitude BETWEEN :minLng AND :maxLng")
    Double findAverageMagnitudeInArea(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    @Query("SELECT COUNT(o) FROM Observation o WHERE o.latitude BETWEEN :minLat AND :maxLat AND o.longitude BETWEEN :minLng AND :maxLng")
    Long countInArea(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    List<Observation> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT o FROM Observation o WHERE o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Observation> findRecentObservations(@Param("since") LocalDateTime since);
}
