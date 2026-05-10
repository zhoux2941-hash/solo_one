package com.petclean.repository;

import com.petclean.entity.CleaningPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CleaningPointRepository extends JpaRepository<CleaningPoint, Long> {

    @Query("SELECT cp FROM CleaningPoint cp WHERE cp.status = :status AND cp.lastCleanTime < :cutoffTime")
    List<CleaningPoint> findExpiredCleaningPoints(@Param("status") String status,
                                                   @Param("cutoffTime") LocalDateTime cutoffTime);

    List<CleaningPoint> findByStatus(String status);
}
