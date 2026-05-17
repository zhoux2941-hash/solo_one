package com.pumpstation.repository;

import com.pumpstation.entity.WaterLevelRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WaterLevelRecordRepository extends JpaRepository<WaterLevelRecord, Long> {
    List<WaterLevelRecord> findByPumpNoOrderByRecordTimeDesc(String pumpNo);
    
    List<WaterLevelRecord> findByPumpNoAndRecordTimeBetweenOrderByRecordTimeAsc(
        String pumpNo, LocalDateTime startTime, LocalDateTime endTime);
}
