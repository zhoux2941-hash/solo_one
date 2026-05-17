package com.ballistic.trajectory.repository;

import com.ballistic.trajectory.model.TrajectoryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrajectoryRecordRepository extends JpaRepository<TrajectoryRecord, Long> {

    List<TrajectoryRecord> findByRecordType(String recordType);

    List<TrajectoryRecord> findByShootDirection(String shootDirection);

    List<TrajectoryRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT t FROM TrajectoryRecord t WHERE t.shootDistance BETWEEN :minDistance AND :maxDistance")
    List<TrajectoryRecord> findByDistanceRange(@Param("minDistance") Double minDistance, 
                                                @Param("maxDistance") Double maxDistance);

    @Query("SELECT t FROM TrajectoryRecord t ORDER BY t.createdAt DESC")
    List<TrajectoryRecord> findAllOrderByCreatedAtDesc();

    List<TrajectoryRecord> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(t) FROM TrajectoryRecord t WHERE t.recordType = :type")
    Long countByRecordType(@Param("type") String type);
}
