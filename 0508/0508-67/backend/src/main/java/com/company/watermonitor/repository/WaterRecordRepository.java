package com.company.watermonitor.repository;

import com.company.watermonitor.entity.WaterRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WaterRecordRepository extends JpaRepository<WaterRecord, Long> {
    
    List<WaterRecord> findByMachineIdOrderByReportTimeDesc(Long machineId);
    
    List<WaterRecord> findByMachineIdAndReportTimeBetweenOrderByReportTime(Long machineId, LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("SELECT w FROM WaterRecord w WHERE w.machineId = :machineId ORDER BY w.reportTime DESC LIMIT 2")
    List<WaterRecord> findLast2RecordsByMachineId(Long machineId);
}
