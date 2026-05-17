package com.pumpstation.repository;

import com.pumpstation.entity.OperationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OperationRecordRepository extends JpaRepository<OperationRecord, Long> {
    List<OperationRecord> findByPumpNoOrderByStartTimeDesc(String pumpNo);
    
    List<OperationRecord> findByPumpNoAndStartTimeBetweenOrderByStartTimeAsc(
        String pumpNo, LocalDateTime startTime, LocalDateTime endTime);
    
    Optional<OperationRecord> findTopByPumpNoAndOperationTypeOrderByStartTimeDesc(
        String pumpNo, String operationType);
    
    @Query("SELECT SUM(o.drainageAmount) FROM OperationRecord o WHERE o.pumpNo = :pumpNo " +
           "AND o.startTime BETWEEN :startTime AND :endTime")
    Double sumDrainageAmountByPumpNoAndTimeRange(
        @Param("pumpNo") String pumpNo,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT SUM(o.energyConsumption) FROM OperationRecord o WHERE o.pumpNo = :pumpNo " +
           "AND o.startTime BETWEEN :startTime AND :endTime")
    Double sumEnergyConsumptionByPumpNoAndTimeRange(
        @Param("pumpNo") String pumpNo,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT SUM(o.runningDuration) FROM OperationRecord o WHERE o.pumpNo = :pumpNo " +
           "AND o.startTime BETWEEN :startTime AND :endTime")
    Long sumRunningDurationByPumpNoAndTimeRange(
        @Param("pumpNo") String pumpNo,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT COUNT(o) FROM OperationRecord o WHERE o.pumpNo = :pumpNo AND o.operationType = 'COMPLETE'")
    Long countOperationByPumpNo(@Param("pumpNo") String pumpNo);
}
