package com.cafeteria.repository;

import com.cafeteria.entity.ConsumptionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsumptionRecordRepository extends JpaRepository<ConsumptionRecord, Long> {
    List<ConsumptionRecord> findByEmployeeIdOrderByConsumptionTimeDesc(String employeeId);
    
    Page<ConsumptionRecord> findByEmployeeIdOrderByConsumptionTimeDesc(String employeeId, Pageable pageable);
    
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM ConsumptionRecord c " +
           "WHERE c.employeeId = :employeeId " +
           "AND c.consumptionTime BETWEEN :startTime AND :endTime")
    Double getDailyTotalAmount(@Param("employeeId") String employeeId,
                                 @Param("startTime") LocalDateTime startTime,
                                 @Param("endTime") LocalDateTime endTime);
}
