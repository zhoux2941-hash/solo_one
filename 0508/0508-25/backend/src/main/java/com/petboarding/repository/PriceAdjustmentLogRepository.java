package com.petboarding.repository;

import com.petboarding.entity.PriceAdjustmentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PriceAdjustmentLogRepository extends JpaRepository<PriceAdjustmentLog, Long> {
    List<PriceAdjustmentLog> findByStatus(PriceAdjustmentLog.AdjustmentStatus status);
    
    List<PriceAdjustmentLog> findByRoomId(Long roomId);
    
    List<PriceAdjustmentLog> findByRoomType(String roomType);
    
    @Query("SELECT p FROM PriceAdjustmentLog p WHERE p.status = :status AND p.startDate <= :endDate AND p.endDate >= :startDate")
    List<PriceAdjustmentLog> findActiveAdjustmentsInRange(
            @Param("status") PriceAdjustmentLog.AdjustmentStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
